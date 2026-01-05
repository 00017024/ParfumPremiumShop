const User = require("../models/User");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");

// GET /users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price");

    res.json({ user, orders });
  } catch (err) {
    next(err);
  }
};

// PUT /users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    next(err);
  }
};
