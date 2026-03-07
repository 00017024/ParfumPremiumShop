const ApiError = require('../utils/ApiError');

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Access denied: Admins only', 'ADMIN_ONLY'));
  }
  next();
};

module.exports = adminMiddleware;
