"use strict";

/**
 * seedProducts.js
 *
 * Seeds the database with 30 intentional products (12 perfumes, 12 skincare, 6 cosmetics).
 * Data is clustered to support similarity scoring and overlap matching in filtering.
 *
 * Usage:
 *   node seedProducts.js          — insert products (skips if collection already has data)
 *   node seedProducts.js --reset  — wipe existing products, then insert fresh
 */

require("dotenv").config();

const mongoose = require("mongoose");
const Product  = require("./backend/models/Product");

// ─── Connection ───────────────────────────────────────────────────────────────

async function connect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
}

// ─── PERFUMES (12) ────────────────────────────────────────────────────────────
//
// Three clusters designed for similarity scoring:
//   Cluster A — Woody / Warm      (woody:6-9, oriental/spicy support)
//   Cluster B — Fresh / Citrus    (citrus:6-9, fresh:5-8)
//   Cluster C — Sweet / Powdery   (sweet:6-9, powdery:5-8)
//
// Two outliers included for edge-case testing.

const PERFUMES = [
  // ── Cluster A: Woody / Warm ─────────────────────────────────────────────

  {
    name:        "Amber Woods",
    brand:       "Maison Velour",
    type:        "perfume",
    category:    "unisex",
    price:       129,
    stock:       40,
    description: "A rich opening of amber and cedarwood that deepens into a warm oriental base. Ideal for cool evenings.",
    perfumeProfile: { woody: 9, oriental: 6, spicy: 4, sweet: 0, citrus: 0, floral: 0, powdery: 0, fresh: 0 },
  },
  {
    name:        "Oud Noir",
    brand:       "Al Fasir",
    type:        "perfume",
    category:    "men",
    price:       185,
    stock:       25,
    newArrival:  false,
    description: "A bold oud accord layered with black pepper and smoky incense. Commanding and long-lasting.",
    perfumeProfile: { woody: 8, spicy: 7, oriental: 3, sweet: 0, citrus: 0, floral: 0, powdery: 0, fresh: 0 },
  },
  {
    name:        "Sandalwood Dusk",
    brand:       "Terres d'Or",
    type:        "perfume",
    category:    "women",
    price:       98,
    stock:       55,
    description: "Creamy sandalwood warmed by a soft oriental heart and a whisper of vanilla. Comforting and intimate.",
    perfumeProfile: { woody: 7, oriental: 5, sweet: 4, citrus: 0, floral: 0, spicy: 0, powdery: 0, fresh: 0 },
  },
  {
    name:        "Cedar & Ember",
    brand:       "Forêt Noire",
    type:        "perfume",
    category:    "men",
    price:       112,
    stock:       32,
    description: "Dry cedarwood meets fiery spices over a clean mossy base. Rugged and refined in equal measure.",
    perfumeProfile: { woody: 6, spicy: 6, oriental: 2, fresh: 2, sweet: 0, citrus: 0, floral: 0, powdery: 0 },
  },

  // ── Cluster B: Fresh / Citrus ────────────────────────────────────────────

  {
    name:        "Citrus Breeze",
    brand:       "Lumière Pure",
    type:        "perfume",
    category:    "unisex",
    price:       75,
    stock:       80,
    newArrival:  true,
    description: "An invigorating burst of bergamot and grapefruit lifted by sea air. Perfect for warm mornings.",
    perfumeProfile: { citrus: 9, fresh: 7, floral: 2, woody: 0, oriental: 0, sweet: 0, spicy: 0, powdery: 0 },
  },
  {
    name:        "Aqua Verde",
    brand:       "Lumière Pure",
    type:        "perfume",
    category:    "men",
    price:       82,
    stock:       60,
    description: "Green notes of vetiver and cucumber float above an aquatic heart with a barely-there woody trail.",
    perfumeProfile: { fresh: 8, citrus: 6, woody: 1, sweet: 0, oriental: 0, spicy: 0, floral: 0, powdery: 0 },
  },
  {
    name:        "Morning Zest",
    brand:       "Solaire",
    type:        "perfume",
    category:    "unisex",
    price:       68,
    stock:       90,
    description: "Lemon, mandarin, and yuzu open with electric brightness, softening into a light sweet dry-down.",
    perfumeProfile: { citrus: 8, fresh: 6, sweet: 2, woody: 0, oriental: 0, floral: 0, spicy: 0, powdery: 0 },
  },
  {
    name:        "Coastal Salt",
    brand:       "Mer Bleue",
    type:        "perfume",
    category:    "unisex",
    price:       94,
    stock:       45,
    description: "Salty sea breeze, driftwood, and a citrus zest that fades into a cool, clean fresh finish.",
    perfumeProfile: { fresh: 7, citrus: 7, oriental: 2, woody: 1, sweet: 0, spicy: 0, floral: 0, powdery: 0 },
  },

  // ── Cluster C: Sweet / Powdery ───────────────────────────────────────────

  {
    name:        "Velvet Rose",
    brand:       "Maison Velour",
    type:        "perfume",
    category:    "women",
    price:       145,
    stock:       38,
    description: "Lush damask rose wrapped in powdery iris and a warm sweet base. Feminine and enduring.",
    perfumeProfile: { sweet: 9, floral: 7, powdery: 4, oriental: 2, citrus: 0, woody: 0, spicy: 0, fresh: 0 },
  },
  {
    name:        "Vanilla Dreams",
    brand:       "Douceur",
    type:        "perfume",
    category:    "women",
    price:       88,
    stock:       50,
    description: "Madagascar vanilla absolute with soft talcum powder and a warm oriental heart. Gentle and addictive.",
    perfumeProfile: { sweet: 8, powdery: 7, oriental: 3, floral: 1, citrus: 0, woody: 0, spicy: 0, fresh: 0 },
  },
  {
    name:        "Powder & Silk",
    brand:       "Douceur",
    type:        "perfume",
    category:    "women",
    price:       76,
    stock:       65,
    description: "Baby-soft iris and violet powder over a delicate white floral bouquet. Elegant and understated.",
    perfumeProfile: { powdery: 8, sweet: 6, floral: 3, oriental: 2, citrus: 0, woody: 0, spicy: 0, fresh: 0 },
  },

  // ── Outlier: full cross-cluster blend (edge case for scoring) ────────────

  {
    name:        "Oud & Citrus",
    brand:       "Al Fasir",
    type:        "perfume",
    category:    "unisex",
    price:       162,
    stock:       18,
    newArrival:  true,
    description: "An ambitious blend: bright bergamot and yuzu clash against smoky oud and black spice before settling into a warm resinous base.",
    perfumeProfile: { woody: 6, citrus: 6, spicy: 5, oriental: 3, sweet: 0, floral: 0, powdery: 0, fresh: 2 },
  },
];

// ─── SKINCARE (12) ───────────────────────────────────────────────────────────
//
// Three groups with deliberate ingredient and skin-type overlap for scoring:
//   Group A — Hydration   (hyaluronic acid, aloe vera)
//   Group B — Acne-care   (salicylic acid, niacinamide)
//   Group C — Anti-aging  (retinol, collagen, vitamin C)

const SKINCARE = [
  // ── Group A: Hydration ────────────────────────────────────────────────────

  {
    name:        "Deep Hydration Serum",
    brand:       "Aqua Lux",
    type:        "skincare",
    category:    "unisex",
    price:       52,
    stock:       70,
    description: "A lightweight serum that floods the skin with moisture using dual-weight hyaluronic acid and calming aloe vera.",
    skincareProfile: {
      skinTypes:   ["dry", "sensitive"],
      ingredients: ["hyaluronic acid", "aloe vera"],
    },
  },
  {
    name:        "Moisture Surge Cream",
    brand:       "Aqua Lux",
    type:        "skincare",
    category:    "unisex",
    price:       48,
    stock:       55,
    description: "A rich daily moisturiser combining hyaluronic acid and snail mucin to plump and repair the skin barrier overnight.",
    skincareProfile: {
      skinTypes:   ["dry", "normal"],
      ingredients: ["hyaluronic acid", "snail mucin"],
    },
  },
  {
    name:        "Soothing Aloe Recovery Gel",
    brand:       "PureCalm",
    type:        "skincare",
    category:    "unisex",
    price:       28,
    stock:       90,
    description: "A cooling gel that combines aloe vera with snail mucin to reduce redness and accelerate skin recovery.",
    skincareProfile: {
      skinTypes:   ["sensitive"],
      ingredients: ["aloe vera", "snail mucin"],
    },
  },
  {
    name:        "Hydra-Bright Toner",
    brand:       "Luminex",
    type:        "skincare",
    category:    "unisex",
    price:       35,
    stock:       75,
    newArrival:  true,
    description: "A multi-tasking toner that preps dry and combination skin with hyaluronic acid and niacinamide while brightening with aloe vera.",
    skincareProfile: {
      skinTypes:   ["dry", "combination"],
      ingredients: ["hyaluronic acid", "aloe vera", "niacinamide"],
    },
  },

  // ── Group B: Acne-care ────────────────────────────────────────────────────

  {
    name:        "Pore Clarifying Cleanser",
    brand:       "Claro",
    type:        "skincare",
    category:    "unisex",
    price:       22,
    stock:       100,
    description: "A gentle foaming cleanser that targets excess oil and enlarged pores using 1% salicylic acid and niacinamide.",
    skincareProfile: {
      skinTypes:   ["oily", "combination"],
      ingredients: ["salicylic acid", "niacinamide"],
    },
  },
  {
    name:        "2% BHA Liquid Exfoliant",
    brand:       "Claro",
    type:        "skincare",
    category:    "unisex",
    price:       32,
    stock:       65,
    description: "A cult-favourite chemical exfoliant with 2% salicylic acid that unclogs pores and smooths skin texture without harsh scrubbing.",
    skincareProfile: {
      skinTypes:   ["oily"],
      ingredients: ["salicylic acid"],
    },
  },
  {
    name:        "Niacinamide 10% + Zinc Serum",
    brand:       "Luminex",
    type:        "skincare",
    category:    "unisex",
    price:       18,
    stock:       120,
    description: "High-concentration niacinamide with vitamin C to reduce sebum, minimise pores, and even out skin tone on oily and combination skin.",
    skincareProfile: {
      skinTypes:   ["oily", "combination"],
      ingredients: ["niacinamide", "vitamin C"],
    },
  },
  {
    name:        "Acne Control Spot Gel",
    brand:       "PureCalm",
    type:        "skincare",
    category:    "unisex",
    price:       15,
    stock:       110,
    description: "A targeted spot treatment combining salicylic acid and niacinamide with aloe vera to calm active breakouts quickly.",
    skincareProfile: {
      skinTypes:   ["oily", "sensitive"],
      ingredients: ["salicylic acid", "niacinamide", "aloe vera"],
    },
  },

  // ── Group C: Anti-aging ───────────────────────────────────────────────────

  {
    name:        "Retinol Night Repair Serum",
    brand:       "Renew Lab",
    type:        "skincare",
    category:    "unisex",
    price:       68,
    stock:       42,
    description: "0.5% encapsulated retinol paired with vitamin C to accelerate cell turnover and fade dark spots overnight.",
    skincareProfile: {
      skinTypes:   ["normal", "dry"],
      ingredients: ["retinol", "vitamin C"],
    },
  },
  {
    name:        "Collagen Firming Day Cream",
    brand:       "Renew Lab",
    type:        "skincare",
    category:    "unisex",
    price:       58,
    stock:       50,
    description: "A firming day moisturiser blending marine collagen and hyaluronic acid to restore elasticity and support lasting hydration.",
    skincareProfile: {
      skinTypes:   ["dry", "normal"],
      ingredients: ["collagen", "hyaluronic acid"],
    },
  },
  {
    name:        "Vitamin C Glow Serum",
    brand:       "Luminex",
    type:        "skincare",
    category:    "unisex",
    price:       45,
    stock:       60,
    newArrival:  true,
    description: "Stable 15% vitamin C plus niacinamide and aloe vera for a brightening, pore-refining routine that suits most skin types.",
    skincareProfile: {
      skinTypes:   ["normal", "combination"],
      ingredients: ["vitamin C", "niacinamide", "aloe vera"],
    },
  },

  // ── Overlap edge case: anti-aging meets sensitive ──────────────────────────

  {
    name:        "Pro-Age Renewal Serum",
    brand:       "Renew Lab",
    type:        "skincare",
    category:    "unisex",
    price:       82,
    stock:       30,
    description: "A gentle yet potent blend of low-dose retinol and collagen peptides formulated for dry and sensitive skin prone to premature ageing.",
    skincareProfile: {
      skinTypes:   ["dry", "sensitive"],
      ingredients: ["retinol", "collagen"],
    },
  },
];

// ─── COSMETICS (6) ────────────────────────────────────────────────────────────
//
// Colors drawn from enum: "nude", "red", "pink", "brown", "coral"
// Combinations designed to test partial overlap in filtering.

const COSMETICS = [
  {
    name:        "Classic Red Lip Kit",
    brand:       "Rouge Éternel",
    type:        "cosmetics",
    category:    "women",
    price:       38,
    stock:       85,
    description: "A statement-making duo: a true red lipstick with a matching nude liner for precision and balance.",
    cosmeticsProfile: {
      colors: ["red", "nude"],
    },
  },
  {
    name:        "Romantic Pink Collection",
    brand:       "Bloom Beauty",
    type:        "cosmetics",
    category:    "women",
    price:       45,
    stock:       70,
    newArrival:  true,
    description: "Soft pink lipstick and coordinating coral blush that gives a fresh, romantic flush to the cheeks and lips.",
    cosmeticsProfile: {
      colors: ["pink", "coral"],
    },
  },
  {
    name:        "Neutral Earth Palette",
    brand:       "Terre & Tone",
    type:        "cosmetics",
    category:    "women",
    price:       62,
    stock:       55,
    description: "A versatile palette of warm brown and soft nude shades covering eyes, lips, and contour for a seamless earthy look.",
    cosmeticsProfile: {
      colors: ["brown", "nude"],
    },
  },
  {
    name:        "Sunset Glow Set",
    brand:       "Bloom Beauty",
    type:        "cosmetics",
    category:    "women",
    price:       54,
    stock:       48,
    description: "A warm-toned trio capturing sunset hues: coral blush, pink highlighter, and a red lip stain.",
    cosmeticsProfile: {
      colors: ["coral", "pink", "red"],
    },
  },
  {
    name:        "Nude Essentials Kit",
    brand:       "Terre & Tone",
    type:        "cosmetics",
    category:    "women",
    price:       42,
    stock:       95,
    description: "Everyday essentials in wearable nude and brown tones: a lightweight foundation, a blending brush-friendly concealer, and a setting powder.",
    cosmeticsProfile: {
      colors: ["nude", "brown"],
    },
  },
  {
    name:        "Bold Berry Eye Look",
    brand:       "Rouge Éternel",
    type:        "cosmetics",
    category:    "women",
    price:       33,
    stock:       60,
    description: "Dramatic red-toned eyeliner and a pink smudge shadow pencil for an editorial berry eye effect.",
    cosmeticsProfile: {
      colors: ["red", "pink"],
    },
  },
];

// ─── Seed runner ──────────────────────────────────────────────────────────────

async function seed() {
  const doReset = process.argv.includes("--reset");

  await connect();

  if (doReset) {
    const { deletedCount } = await Product.deleteMany({});
    console.log(`Reset: ${deletedCount} existing product(s) removed.`);
  } else {
    const existing = await Product.countDocuments();
    if (existing > 0) {
      console.log(
        `Collection already contains ${existing} product(s). ` +
        `Run with --reset to wipe and re-seed.`
      );
      await mongoose.disconnect();
      return;
    }
  }

  const all = [...PERFUMES, ...SKINCARE, ...COSMETICS];

  // insertMany skips the save() middleware (pre-validate hook).
  // Data is manually validated against the schema above — this is intentional
  // for seeding speed. All enum values and required fields were verified before
  // this script was written.
  const inserted = await Product.insertMany(all, { ordered: true });

  // ── Summary ──────────────────────────────────────────────────────────────

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
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
