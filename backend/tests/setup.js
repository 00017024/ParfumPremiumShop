const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

// Connect
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Test database connected");
  } catch (error) {
    console.error("Test DB connection failed:", error);
    throw error;
  }
});

// Clear database
const clearDatabase = async () => {
  // Use the native driver to list collections to ensure we catch any
  // collections created dynamically during tests.
  const collections = await mongoose.connection.db.collections();

  await Promise.all(
    collections.map(async (collection) => {
      try {
        // Use deleteMany rather than drop to avoid issues with concurrent
        // connections or system collections.
        await collection.deleteMany({});
      } catch (err) {
        // Log and continue - tests should not crash during cleanup.
        // This mirrors the previous behavior but is more robust.
        // eslint-disable-next-line no-console
        console.warn(`Failed to clear collection ${collection.collectionName}:`, err.message || err);
      }
    })
  );
};

afterEach(async () => {
  await clearDatabase();
});

// Disconnect
afterAll(async () => {
  try {
    // Final cleanup to ensure a clean state for the next run
    await clearDatabase();
  } catch (err) {
    // ignore cleanup errors during shutdown
  } finally {
    await mongoose.connection.close();
    console.log("Test database disconnected");
  }
});