const rateLimit = require("express-rate-limit");

const passthrough = (_req, _res, next) => next();

const otpRateLimiter = process.env.NODE_ENV === "test"
  ? passthrough
  : rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 5,
      keyGenerator: (req) => {
        const email = (req.body && req.body.email) ? req.body.email.toLowerCase() : "unknown";
        return `${req.ip}:${email}`;
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
