const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

/**
 * Register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Phone validation (Uzbekistan format: +998XXXXXXXXX)
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new ApiError(
        400,
        "Invalid phone number format. Use +998XXXXXXXXX",
        "PHONE_INVALID"
      );
    }

    // Check for existing email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      throw new ApiError(
        400,
        "Email or phone already in use",
        "USER_ALREADY_EXISTS"
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // First registered user becomes admin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    // Mongo duplicate key safeguard
    if (err.code === 11000) {
      return next(
        new ApiError(
          400,
          "Email or phone already in use",
          "USER_DUPLICATE_KEY"
        )
      );
    }

    next(err);
  }
};

/**
 * Login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(
        400,
        "Invalid credentials",
        "AUTH_INVALID_CREDENTIALS"
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(
        400,
        "Invalid credentials",
        "AUTH_INVALID_CREDENTIALS"
      );
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};
