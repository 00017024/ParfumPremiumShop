const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");
const corsMiddleware = require("./middleware/corsConfig");
const { authLimiter, publicReadLimiter, userLimiter } = require("./middleware/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");


dotenv.config();

// Validate
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined");
  process.exit(1);
}

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();
app.set("trust proxy", 1);

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json());
app.use("/auth",     authLimiter,       authRoutes);
app.use("/products", publicReadLimiter, productRoutes);
app.use("/orders",   userLimiter,       orderRoutes);
app.use("/users",    userLimiter,       userRoutes);
app.use("/admin",    userLimiter,        adminRoutes);

app.get("/", (req, res) => {
  res.send("Parfum Premium API is running...");
});

// ── Error handler ───────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;