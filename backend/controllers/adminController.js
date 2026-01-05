const User = require("../models/User");
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
    delete updates.password; // prevent password updates here

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
