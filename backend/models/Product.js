const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    popularity: { type: Number, default: 0 },
    newArrival: { type: Boolean, default: false },
    imageUrl: { type: String },
    stock: { type: Number, default: 0 },
    categories: [{ type: String }],
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
