const User = require("../models/User");
const { Order, ORDER_STATUS } = require("../models/Order");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

// Single source of truth for which statuses count as revenue-generating.
// Used by both getStats and getAnalytics so they can never drift apart.
const REVENUE_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.COMPLETED,
];

/**
 * Purpose: Returns paginated list of all users (passwords excluded), newest first.
 * Input: Query params — page, limit (max 100)
 * Output: { total, page, pages, users }
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const total = await User.countDocuments();
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ total, page, pages: Math.ceil(total / limit), users });
  } catch (err) {
    next(err);
  }
};

/**
 * Purpose: Fetches a single user by ID, excluding the password field.
 * Output: User document or 404 ApiError.
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * Purpose: Updates any user fields except password (password key is stripped before applying).
 * Input: Any User fields in req.body
 * Output: Updated user document (password excluded) or 404 ApiError.
 */
exports.updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.password; 

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * Purpose: Sets isActive=false to prevent the user from logging in; self-blocking is disallowed.
 * Output: { message, user } or 400 if the admin attempts to block their own account.
 */
exports.blockUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      throw new ApiError(400, "You cannot block your own account", "CANNOT_BLOCK_SELF");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    res.json({ message: "User blocked", user });
  } catch (err) {
    next(err);
  }
};

/**
 * Purpose: Restores access for a blocked user by setting isActive=true.
 * Output: { message, user } or 404 ApiError.
 */
exports.unblockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    res.json({ message: "User unblocked", user });
  } catch (err) {
    next(err);
  }
};

/**
 * Purpose: Runs 7 parallel aggregations to produce dashboard analytics (top products, sales trends, user growth, revenue, conversion rate).
 * Output: { topProductsByCategory, mostActiveUser, weeklySales, userGrowth, revenueOverTime, conversionRate }
 */
exports.getAnalytics = async (_req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      topByCategory,
      mostActiveArr,
      weeklySales,
      userGrowth,
      revenueOverTime,
      buyersArr,
      totalUsers,
    ] = await Promise.all([

      // A — top-selling product per product type
      // $lookup and $unwind are NOT documented as sort-preserving stages, so
      // $sort is placed immediately before the final $group — no intervening
      // stages can disrupt the order that $first relies on.
      Order.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" } } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $sort: { totalSold: -1 } },          // ← right before $group
        {
          $group: {
            _id:       "$product.type",
            name:      { $first: "$product.name" },
            brand:     { $first: "$product.brand" },
            totalSold: { $first: "$totalSold" },
          },
        },
      ]),

      // B — user with the most orders
      Order.aggregate([
        { $group: { _id: "$user", orderCount: { $sum: 1 } } },
        { $sort: { orderCount: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            name:       "$user.name",
            email:      "$user.email",
            orderCount: 1,
          },
        },
      ]),

      // C — order count per day for the last 7 days
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      // D — new user registrations per day for the last 30 days
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      // E — daily revenue for the last 30 days (revenue-generating orders only)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status:    { $in: REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalPrice" },
            count:   { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: 1, count: 1 } },
      ]),

      // F — distinct users who placed at least one order (for conversion rate)
      Order.aggregate([
        { $group: { _id: "$user" } },
        { $count: "total" },
      ]),

      User.countDocuments(),
    ]);

    // Reshape array → { perfume: {...}, skincare: {...}, cosmetics: {...} }
    const topProductsByCategory = {};
    for (const item of topByCategory) {
      topProductsByCategory[item._id] = {
        name:      item.name,
        brand:     item.brand,
        totalSold: item.totalSold,
      };
    }

    const buyers         = buyersArr[0]?.total ?? 0;
    const conversionRate = totalUsers > 0
      ? Math.round((buyers / totalUsers) * 100)
      : 0;

    res.json({
      topProductsByCategory,
      mostActiveUser:  mostActiveArr[0] ?? null,
      weeklySales,
      userGrowth,
      revenueOverTime,
      conversionRate: { rate: conversionRate, buyers, totalUsers },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Purpose: Returns { lat, lng } pairs for all orders that have a recorded delivery location.
 * Output: Array of { lat, lng } objects for map rendering.
 */
exports.getOrderLocations = async (_req, res, next) => {
  try {
    const orders = await Order.find(
      { "location.lat": { $exists: true }, "location.lng": { $exists: true } },
      { "location.lat": 1, "location.lng": 1, _id: 0 }
    ).lean();

    const locations = orders.map((o) => ({ lat: o.location.lat, lng: o.location.lng }));
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

/**
 * Purpose: Returns high-level KPI counts (orders, revenue, pending, users, products) plus 5 recent orders.
 * Output: { totalOrders, totalRevenue, pendingOrders, totalUsers, totalProducts, recentOrders }
 */
exports.getStats = async (_req, res, next) => {
  try {
    const [orderStats, totalUsers, totalProducts] = await Promise.all([
      Order.aggregate([
        {
          $facet: {
            totalOrders: [{ $count: "count" }],

            revenue: [
              {
                $match: { status: { $in: REVENUE_STATUSES } },
              },
              { $group: { _id: null, total: { $sum: "$totalPrice" } } },
            ],

            pendingOrders: [
              { $match: { status: ORDER_STATUS.PENDING } },
              { $count: "count" },
            ],

            recentOrders: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: "users",
                  let: { userId: "$user" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                    { $project: { name: 1, email: 1 } },
                  ],
                  as: "user",
                },
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "products",
                  let: { productIds: "$items.product" },
                  pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$productIds"] } } },
                    { $project: { name: 1, price: 1, brand: 1, imageUrl: 1 } },
                  ],
                  as: "populatedProducts",
                },
              },
            ],
          },
        },
      ]),

      User.countDocuments(),
      Product.countDocuments(),
    ]);

    const stats = orderStats[0];

    res.json({
      totalOrders:   stats.totalOrders[0]?.count   ?? 0,
      totalRevenue:  stats.revenue[0]?.total        ?? 0,
      pendingOrders: stats.pendingOrders[0]?.count  ?? 0,
      totalUsers,
      totalProducts,
      recentOrders:  stats.recentOrders,
    });
  } catch (err) {
    next(err);
  }
};