const cors = require("cors");
const buildAllowedOrigins = () => {
  if (process.env.CORS_ALLOWED_ORIGINS) {
    return process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "WARNING: CORS_ALLOWED_ORIGINS is not set in production. " +
        "All cross-origin requests will be blocked."
    );
    return [];
  }

  // Development fallback
  return ["http://localhost:5173", "http://localhost:3000"];
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header) and allowed origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);