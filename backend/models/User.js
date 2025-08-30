const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // prevents returning password in queries unless explicitly selected
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format'], 
    // Example: +998991234567 or 998991234567
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
