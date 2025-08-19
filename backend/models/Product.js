const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  popularity: { type: Number, default: 0 },  // e.g., purchase count
  newArrival: { type: Boolean, default: false },
  imageUrl: { type: String },                // optional
  stock: { type: Number, default: 0 },       // optional
  categories: [{ type: String }],            // optional
  rating: { type: Number, default: 0 },      // optional, avg rating
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
