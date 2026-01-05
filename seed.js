const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./backend/models/Product");

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const sampleProducts = [
  {
    name: "Dior Sauvage",
    brand: "Dior",
    price: 120,
    description: "Fresh and spicy fragrance with bergamot and ambroxan.",
    popularity: 10,
    newArrival: false,
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    name: "Chanel No.5",
    brand: "Chanel",
    price: 150,
    description: "Classic floral-aldehyde fragrance, timeless and elegant.",
    popularity: 15,
    newArrival: false,
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    name: "Versace Eros",
    brand: "Versace",
    price: 110,
    description: "Bold and sensual fragrance with mint, vanilla, and tonka bean.",
    popularity: 8,
    newArrival: true,
    imageUrl: "https://via.placeholder.com/150",
  },
];

const seedProducts = async () => {
  try {
    await Product.deleteMany(); // Clear old products
    await Product.insertMany(sampleProducts);
    console.log("Sample products added!");
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
};

seedProducts();
