const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const BlacklistedToken = require("../models/BlacklistedToken");
const ApiError = require("../utils/ApiError");

/*
Generate a signed JWT with a unique jti claim.
 */
const signToken = (payload) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { ...payload, jti },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  return { token, jti };
};
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

    const { token } = signToken({ id: user._id, role: user.role });

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

    const { token } = signToken({ id: user._id, role: user.role });

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

// POST /auth/logout
exports.logout = async (req, res, next) => {
  try {
    const rawToken = req.header('Authorization')?.replace('Bearer ', '');

    if (rawToken) {
      const decoded = jwt.decode(rawToken);

      if (decoded?.jti && decoded?.exp) {
        await BlacklistedToken.create({
          jti: decoded.jti,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    // Never block logout — even if blacklisting fails, the client
    // clears its token and the session ends from the user's perspective.
    next(err);
  }
};