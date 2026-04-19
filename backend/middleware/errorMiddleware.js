const ApiError = require("../utils/ApiError");

const isProduction = process.env.NODE_ENV === "production";

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`, err);

  // Trusted errors: thrown deliberately by controllers via ApiError
  if (err instanceof ApiError) {
    const body = {
      success: false,
      message: err.message,
      code: err.code || null,
    };
    if (Array.isArray(err.details) && err.details.length > 0) {
      body.details = err.details;
    }
    return res.status(err.statusCode).json(body);
  }

  // Payload too large — body-parser sets err.status + err.type, not err.statusCode.
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Payload too large." });
  }

  // Untrusted errors: unexpected exceptions (DB driver, JWT, etc.)
  // Never expose their raw message in production.
  const message = isProduction ? "Something went wrong" : err.message;
  const body = { success: false, message };
  if (!isProduction && err.stack) {
    body.stack = err.stack;
  }

  res.status(500).json(body);
};

module.exports = errorHandler;
