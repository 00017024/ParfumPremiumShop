const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next(new ApiError(401, 'No token, authorization denied', 'NO_TOKEN'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return next(new ApiError(404, 'User not found', 'USER_NOT_FOUND'));
    if (!user.isActive) return next(new ApiError(403, 'Account is blocked. Contact support.', 'USER_BLOCKED'));

    req.user = user;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid token', 'TOKEN_INVALID'));
  }
};

module.exports = authMiddleware;
