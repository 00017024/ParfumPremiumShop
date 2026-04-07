const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const body = {
    success: false,
    message: err.message || "Internal Server Error",
    error:   err.message || "Internal Server Error",
    code:    err.code    || null,
  };

  // Only include `details` when there are per-field messages to surface.
  if (Array.isArray(err.details) && err.details.length > 0) {
    body.details = err.details;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
