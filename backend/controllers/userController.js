const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');

// GET profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // exclude password
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optionally include user orders
    const orders = await Order.find({ user: req.user.id }).populate('orderItems.product', 'name price');

    res.json({ user, orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
