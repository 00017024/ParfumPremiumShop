const User = require("../models/User");
const { Order, ORDER_STATUS } = require("../models/Order");
const ApiError = require("../utils/ApiError");

// GET /admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
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

// GET /admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [orderStats, totalUsers] = await Promise.all([
      Order.aggregate([
        {
          $facet: {
            totalOrders: [{ $count: "count" }],

            revenue: [
              { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
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
                  localField: "user",
                  foreignField: "_id",
                  as: "user",
                  pipeline: [{ $project: { name: 1, email: 1 } }],
                },
              },
              { $unwind: { path: "$user", preserveNullAndEmpty: true } },
              {
                $lookup: {
                  from: "products",
                  localField: "items.product",
                  foreignField: "_id",
                  as: "populatedProducts",
                  pipeline: [{ $project: { name: 1, price: 1, brand: 1, imageUrl: 1 } }],
                },
              },
            ],
          },
        },
      ]),

      User.countDocuments(),
    ]);

    const stats = orderStats[0];

    res.json({
      totalOrders:   stats.totalOrders[0]?.count   ?? 0,
      totalRevenue:  stats.revenue[0]?.total        ?? 0,
      pendingOrders: stats.pendingOrders[0]?.count  ?? 0,
      totalUsers,
      recentOrders:  stats.recentOrders,
    });
  } catch (err) {
    next(err);
  }
};