const rateLimit = require("express-rate-limit");

/**
 * Purpose: No-op middleware substituted for all limiters in test mode to avoid false 429s during Jest runs.
 */
const passthrough = (_req, _res, next) => next();

/**
 * Purpose: Shared handler for all express-rate-limit instances; returns a consistent 429 JSON error.
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  });
};

/*
 Auth endpoints (login, register).
 Strict: 10 attempts per 15 minutes per IP.
 */
const authLimiter = process.env.NODE_ENV === "test"
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler,
    });

/*
 Public read endpoints (product listing, product detail).
 Generous: 200 requests per minute per IP.
 */
const publicReadLimiter = process.env.NODE_ENV === "test"
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler,
    });

/*
 Authenticated user endpoints (orders, profile).
 Moderate: 60 requests per minute per IP.
 */
const userLimiter = process.env.NODE_ENV === "test"
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler,
    });

module.exports = { authLimiter, publicReadLimiter, userLimiter };