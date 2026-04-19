const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const helmet = require("helmet");

const validateEnv = require("./utils/validateEnv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");
const corsMiddleware = require("./middleware/corsConfig");
const { authLimiter, publicReadLimiter, userLimiter } = require("./middleware/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

validateEnv();

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();
app.set("trust proxy", 1);

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: process.env.NODE_ENV === "production"
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}));
app.use(corsMiddleware);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));
app.use("/auth",     authLimiter,       authRoutes);
app.use("/products", publicReadLimiter, productRoutes);
app.use("/orders",   userLimiter,       orderRoutes);
app.use("/users",    userLimiter,       userRoutes);
app.use("/admin",    userLimiter,        adminRoutes);

// ── Error handler ───────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;