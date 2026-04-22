const ApiError = require('../utils/ApiError');

/**
 * Purpose: Guards a route to admin users only; must run after authMiddleware.
 * Output: Calls next() if req.user.role === 'admin', otherwise passes a 403 ApiError.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Access denied: Admins only', 'ADMIN_ONLY'));
  }
  next();
};

module.exports = adminMiddleware;
