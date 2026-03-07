const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
//register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
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

    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();
    let role = "user";

    // First user becomes admin automatically
    if (userCount === 0) {
      role = "admin";
    } else if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL) {
      // Subsequent users can be admin if they match ADMIN_EMAIL
      role = "admin";
    }

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

//login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    const passwordToCompare = user ? user.password : '$2a$10$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const isMatch = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isMatch) {
      throw new ApiError(400, "Invalid credentials", "AUTH_INVALID_CREDENTIALS");
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
