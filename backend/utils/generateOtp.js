const crypto = require("crypto");

const generateOtp = () => {
  const value = crypto.randomBytes(4).readUInt32BE(0) % 1_000_000;
  return String(value).padStart(6, "0");
};

module.exports = generateOtp;
