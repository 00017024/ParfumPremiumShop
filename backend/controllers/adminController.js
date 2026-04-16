const User = require("../models/User");
const { Order, ORDER_STATUS } = require("../models/Order");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

// GET /admin/users
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

// GET /admin/users/:id
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

// PUT /admin/users/:id
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

// POST /admin/users/:id/block
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

// POST /admin/users/:id/unblock
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

// GET /admin/order-locations
exports.getOrderLocations = async (req, res, next) => {
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

// GET /admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [orderStats, totalUsers, totalProducts] = await Promise.all([
      Order.aggregate([
        {
          $facet: {
            totalOrders: [{ $count: "count" }],

            revenue: [
              {
                $match: {
                  status: {
                    $in: [
                      ORDER_STATUS.PAID,
                      ORDER_STATUS.CONFIRMED,
                      ORDER_STATUS.COMPLETED,
                    ],
                  },
                },
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