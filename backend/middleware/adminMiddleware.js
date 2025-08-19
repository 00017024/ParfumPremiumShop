const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id); // req.user from authMiddleware
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error while checking admin rights' });
  }
};

module.exports = adminMiddleware;
