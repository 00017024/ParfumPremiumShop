const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const BlacklistedToken = require("../models/BlacklistedToken");
const ApiError = require("../utils/ApiError");
const { sendOtpEmail } = require("../utils/email");
const generateOtp = require("../utils/generateOtp");

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

const signToken = (payload) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { ...payload, jti },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  return { token, jti };
};

// POST /auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      throw new ApiError(400, "Email or phone already in use", "USER_ALREADY_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isVerified: false,
      otpCode: hashedOtp,
      otpExpires: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      await sendOtpEmail(email, otp);
    } catch {
      throw new ApiError(500, "Failed to send verification email", "EMAIL_SEND_FAILED");
    }

    await user.save();

    res.status(201).json({ message: "OTP sent. Please verify your email." });
  } catch (err) {
    if (err.code === 11000) {
      return next(new ApiError(400, "Email or phone already in use", "USER_DUPLICATE_KEY"));
    }
    next(err);
  }
};

// POST /auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otpCode +otpExpires");

    if (!user) {
      throw new ApiError(400, "Invalid or expired OTP", "OTP_INVALID");
    }

    if (!user.otpCode || !user.otpExpires || Date.now() > user.otpExpires.getTime()) {
      throw new ApiError(400, "OTP has expired", "OTP_EXPIRED");
    }

    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
      throw new ApiError(400, "Invalid OTP", "OTP_INVALID");
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    const { token } = signToken({ id: user._id, role: user.role });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/resend-otp
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select("+otpCode +otpExpires");

    if (!user) {
      // Don't reveal whether the email exists
      return res.json({ message: "If that email exists, a new OTP has been sent." });
    }

    if (user.isVerified) {
      throw new ApiError(400, "Account already verified", "ALREADY_VERIFIED");
    }

    // Rate limit: don't resend if previous OTP was issued less than 1 minute ago
    const issuedAt = user.otpExpires
      ? user.otpExpires.getTime() - OTP_TTL_MS
      : 0;
    if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "Please wait before requesting another OTP", "OTP_RESEND_COOLDOWN");
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otpCode = hashedOtp;
    user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendOtpEmail(email, otp);

    res.json({ message: "A new OTP has been sent to your email." });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    const passwordToCompare = user ? user.password : "$2a$10$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
    const isMatch = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isMatch) {
      throw new ApiError(400, "Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    if (!user.isVerified) {
      throw new ApiError(403, "Please verify your email before logging in", "EMAIL_NOT_VERIFIED");
    }

    const { token } = signToken({ id: user._id, role: user.role });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
exports.logout = async (req, res, next) => {
  try {
    const rawToken = req.header("Authorization")?.replace("Bearer ", "");

    if (rawToken) {
      let decoded;
      try {
        decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      if (decoded.jti && decoded.exp) {
        await BlacklistedToken.create({
          jti: decoded.jti,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};
