const WEAK_SECRETS = new Set(["secret", "password", "123456", "changeme", "jwt_secret", "mysecret"]);

/**
 * Purpose: Validates critical environment variables at startup; exits the process on any failure.
 * Output: Returns void on success; process.exit(1) if JWT_SECRET is missing, too short, or a known weak value.
 */
const validateEnv = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("FATAL: JWT_SECRET is not defined.");
    process.exit(1);
  }

  if (secret.length < 32) {
    console.error("FATAL: JWT_SECRET must be at least 32 characters.");
    process.exit(1);
  }

  if (WEAK_SECRETS.has(secret.toLowerCase())) {
    console.error("FATAL: JWT_SECRET is a known weak value. Use a strong random secret.");
    process.exit(1);
  }
};

module.exports = validateEnv;
