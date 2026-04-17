"use strict";

/**
 * seedProducts.js
 *
 * Seeds the database from the ML training dataset:
 *   ml/data/raw/products.json
 *
 * Usage (run from project root):
 *   node backend/seed/seedProducts.js          — insert products (skips if collection already has data)
 *   node backend/seed/seedProducts.js --reset  — wipe existing products, then insert fresh
 */

const path = require("path");

// Load .env from project root regardless of where the script is invoked from
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose  = require("mongoose");
const connectDB = require("../config/db");
const Product   = require("../models/Product");

const products = require("../../ml/data/raw/products.json");

async function seed() {
  const doReset = process.argv.includes("--reset");

  await connectDB();

  // ── Guard: skip if data already exists (unless --reset is passed) ──────────
  if (!doReset) {
    const existing = await Product.countDocuments();
    if (existing > 0) {
      console.log(
        `Collection already contains ${existing} product(s). ` +
        `Run with --reset to wipe and re-seed.`
      );
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  // ── Wipe existing data when --reset is passed ──────────────────────────────
  if (doReset) {
    const { deletedCount } = await Product.deleteMany({});
    console.log(`Reset: ${deletedCount} existing product(s) removed.`);
  }

  // ── Insert ─────────────────────────────────────────────────────────────────
  const productsWithStock = products.map((p) => ({
    ...p,
    stock: Math.floor(Math.random() * 51), // random 0–50
  }));
  const inserted = await Product.insertMany(productsWithStock, { ordered: true });

  // ── Summary ────────────────────────────────────────────────────────────────
  const byType = inserted.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  console.log("\n─────────────────────────────");
  console.log(` Seeded ${inserted.length} products`);
  console.log("─────────────────────────────");
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type.padEnd(10)} ${count}`);
  });
  console.log("─────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
