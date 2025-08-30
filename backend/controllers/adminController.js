const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user (role, name, phone, etc.)
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body; 
    delete updates.password; // prevent password updates here

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User blocked', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User unblocked', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
