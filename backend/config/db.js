const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);

    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }

    throw err;
  }
};

module.exports = connectDB;
