const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Load env
dotenv.config();

// Validate
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET not defined");
  process.exit(1);
}

// Connect to database
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Parfum Premium API is running...");
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;