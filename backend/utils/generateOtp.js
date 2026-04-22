const crypto = require("crypto");

/**
 * Purpose: Generates a cryptographically random 6-digit OTP string (zero-padded).
 * Output: e.g. "042891"
 */
const generateOtp = () => {
  const value = crypto.randomBytes(4).readUInt32BE(0) % 1_000_000;
  return String(value).padStart(6, "0");
};

module.exports = generateOtp;
