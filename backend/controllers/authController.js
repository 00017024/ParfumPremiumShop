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

    const user = await User.findOne({ email }).select(
      "+otpCode +otpExpires +otpAttempts +otpAttemptsExpires"
    );

    if (!user) {
      throw new ApiError(400, "Invalid or expired OTP", "OTP_INVALID");
    }

    if (!user.otpCode || !user.otpExpires || Date.now() > user.otpExpires.getTime()) {
      throw new ApiError(400, "OTP has expired", "OTP_EXPIRED");
    }

    // Reset attempt window if it has expired
    const now = Date.now();
    if (!user.otpAttemptsExpires || now > user.otpAttemptsExpires.getTime()) {
      user.otpAttempts = 0;
      user.otpAttemptsExpires = new Date(now + OTP_TTL_MS);
    }

    if (user.otpAttempts >= 5) {
      await user.save();
      throw new ApiError(429, "Too many attempts. Try again later.", "OTP_LIMIT");
    }

    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      throw new ApiError(400, "Invalid OTP", "OTP_INVALID");
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpAttemptsExpires = undefined;
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
  const MIN_RESPONSE_MS = 500;
  const start = Date.now();
  const genericReply = async () => {
    const elapsed = Date.now() - start;
    const wait = Math.max(0, MIN_RESPONSE_MS - elapsed);
    await new Promise((resolve) => setTimeout(resolve, wait));
    res.json({ success: true, message: "If an account exists, an OTP has been sent." });
  };

  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("+otpCode +otpExpires");

    // Silently bail for unknown emails, verified accounts, and cooldown — all
    // return the same response so the caller learns nothing about account state.
    if (!user || user.isVerified) return genericReply();

    const issuedAt = user.otpExpires ? user.otpExpires.getTime() - OTP_TTL_MS : 0;
    if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) return genericReply();

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otpCode = hashedOtp;
    user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendOtpEmail(email, otp);

    return genericReply();
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
        return next(new ApiError(401, "Invalid or expired token", "TOKEN_INVALID"));
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
