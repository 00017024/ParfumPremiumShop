const mongoose = require('mongoose');
const { UZ_PHONE_REGEX, UZ_PHONE_MESSAGE } = require('../validators/phone');

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
    select: false,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [UZ_PHONE_REGEX, UZ_PHONE_MESSAGE],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive:    { type: Boolean, default: true },
  isVerified:  { type: Boolean, default: false },
  otpCode:     { type: String, select: false },
  otpExpires:  { type: Date,   select: false },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);