const { default: rateLimit, ipKeyGenerator } = require("express-rate-limit");

/**
 * Purpose: No-op middleware used in test mode to bypass OTP rate limiting during Jest runs.
 */
const passthrough = (_req, _res, next) => next();

/**
 * Purpose: Rate-limits OTP requests to 5 per 10-minute window, keyed by IP + email to prevent enumeration.
 */
const otpRateLimiter = process.env.NODE_ENV === "test"
  ? passthrough
  : rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 5,
      keyGenerator: (req) => {
        const email = req.body?.email?.toLowerCase() || "unknown";
        return `${ipKeyGenerator(req)}:${email}`;
      },
      standardHeaders: false,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          message: "Too many attempts. Try again later.",
        });
      },
    });

module.exports = otpRateLimiter;
