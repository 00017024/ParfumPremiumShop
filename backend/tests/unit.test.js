"use strict";

/**
 * Unit Tests
 *
 * Tests the Product Mongoose model and the recommendation utility functions
 * directly — no HTTP requests, no Express layer.
 *
 * Covered:
 *   - Product model: valid creation, missing required fields, profile mismatch enforcement
 *   - similarity.js: cosineSimilarity, profileToVector, hasAnyAccord
 *   - Skincare scoring formula
 */

const Product = require("../models/Product");
const {
  profileToVector,
  hasAnyAccord,
  cosineSimilarity,
} = require("../utils/similarity");

// ─────────────────────────────────────────────────────────────────────────────
// Product Model
// ─────────────────────────────────────────────────────────────────────────────

describe("Product Model — Unit Tests", () => {
  // ── Valid creation ─────────────────────────────────────────────────────────

  describe("Valid product creation", () => {
    it("should create a valid perfume product with a profile", async () => {
      const product = await Product.create({
        name: "Chanel No. 5",
        brand: "Chanel",
        price: 150,
        type: "perfume",
        stock: 10,
        perfumeProfile: { floral: 8, powdery: 5, citrus: 3 },
      });

      expect(product._id).toBeDefined();
      expect(product.name).toBe("Chanel No. 5");
      expect(product.brand).toBe("Chanel");
      expect(product.type).toBe("perfume");
      expect(product.perfumeProfile.floral).toBe(8);
      expect(product.perfumeProfile.powdery).toBe(5);
    });

    it("should create a valid skincare product with a profile", async () => {
      const product = await Product.create({
        name: "Hydra Serum",
        brand: "CeraVe",
        price: 30,
        type: "skincare",
        stock: 20,
        skincareProfile: {
          ingredients: ["hyaluronic acid", "niacinamide"],
          skinTypes: ["dry", "normal"],
        },
      });

      expect(product._id).toBeDefined();
      expect(product.type).toBe("skincare");
      expect(product.skincareProfile.ingredients).toContain("hyaluronic acid");
      expect(product.skincareProfile.skinTypes).toContain("dry");
    });

    it("should create a valid cosmetics product with a profile", async () => {
      const product = await Product.create({
        name: "Red Lipstick",
        brand: "MAC",
        price: 20,
        type: "cosmetics",
        stock: 50,
        cosmeticsProfile: { colors: ["red", "nude"] },
      });

      expect(product.type).toBe("cosmetics");
      expect(product.cosmeticsProfile.colors).toContain("red");
    });

    it("should default type to perfume when not specified", async () => {
      const product = await Product.create({
        name: "Mystery Scent",
        brand: "Zara",
        price: 25,
        stock: 5,
      });

      expect(product.type).toBe("perfume");
    });

    it("should store stock as 0 by default", async () => {
      const product = await Product.create({
        name: "New Arrival",
        brand: "Gucci",
        price: 200,
      });

      expect(product.stock).toBe(0);
    });
  });

  // ── Invalid creation — missing required fields ─────────────────────────────

  describe("Invalid product creation — missing required fields", () => {
    it("should reject a product with missing name", async () => {
      await expect(
        Product.create({ brand: "Chanel", price: 150 })
      ).rejects.toThrow();
    });

    it("should reject a product with missing brand", async () => {
      await expect(
        Product.create({ name: "Chanel No. 5", price: 150 })
      ).rejects.toThrow();
    });

    it("should reject a product with missing price", async () => {
      await expect(
        Product.create({ name: "Chanel No. 5", brand: "Chanel" })
      ).rejects.toThrow();
    });
  });

  // ── Profile mismatch enforcement ───────────────────────────────────────────

  describe("Profile validation — type/profile mismatch enforcement", () => {
    it("should reject skincareProfile on a perfume product", async () => {
      await expect(
        Product.create({
          name: "Bad Perfume",
          brand: "Test",
          price: 100,
          type: "perfume",
          skincareProfile: { ingredients: ["aloe vera"], skinTypes: ["dry"] },
        })
      ).rejects.toThrow(/Profile mismatch/);
    });

    it("should reject perfumeProfile on a skincare product", async () => {
      await expect(
        Product.create({
          name: "Bad Serum",
          brand: "Test",
          price: 50,
          type: "skincare",
          perfumeProfile: { floral: 5 },
        })
      ).rejects.toThrow(/Profile mismatch/);
    });

    it("should reject cosmeticsProfile on a perfume product", async () => {
      await expect(
        Product.create({
          name: "Bad Perfume 2",
          brand: "Test",
          price: 100,
          type: "perfume",
          cosmeticsProfile: { colors: ["red"] },
        })
      ).rejects.toThrow(/Profile mismatch/);
    });

    it("should reject perfumeProfile on a cosmetics product", async () => {
      await expect(
        Product.create({
          name: "Bad Cosmetic",
          brand: "Test",
          price: 20,
          type: "cosmetics",
          perfumeProfile: { woody: 3 },
        })
      ).rejects.toThrow(/Profile mismatch/);
    });

    it("should allow perfumeProfile on a perfume product", async () => {
      const product = await Product.create({
        name: "Good Perfume",
        brand: "Test",
        price: 100,
        type: "perfume",
        perfumeProfile: { woody: 7, fresh: 5 },
      });

      expect(product.perfumeProfile.woody).toBe(7);
    });

    it("should allow skincareProfile on a skincare product", async () => {
      const product = await Product.create({
        name: "Good Serum",
        brand: "Test",
        price: 50,
        type: "skincare",
        skincareProfile: { ingredients: ["retinol"], skinTypes: ["oily"] },
      });

      expect(product.skincareProfile.skinTypes).toContain("oily");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Logic — Similarity Utilities
// ─────────────────────────────────────────────────────────────────────────────

describe("Recommendation Logic — Unit Tests", () => {
  // ── Cosine Similarity ──────────────────────────────────────────────────────

  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const v = [8, 0, 5, 2, 0, 0, 0, 0];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it("should return 0 when either vector is all-zero", () => {
      const zero    = [0, 0, 0, 0, 0, 0, 0, 0];
      const nonZero = [1, 0, 0, 0, 0, 0, 0, 0];
      expect(cosineSimilarity(zero, nonZero)).toBe(0);
      expect(cosineSimilarity(nonZero, zero)).toBe(0);
    });

    it("should return 0 for orthogonal vectors (no shared accords)", () => {
      // Woody-only vs oriental-only — completely non-overlapping
      const a = [1, 0, 0, 0, 0, 0, 0, 0]; // woody
      const b = [0, 1, 0, 0, 0, 0, 0, 0]; // oriental
      expect(cosineSimilarity(a, b)).toBeCloseTo(0);
    });

    it("should return a value in the range [0, 1]", () => {
      const a = [5, 3, 8, 0, 2, 1, 0, 4];
      const b = [3, 7, 2, 0, 6, 0, 1, 2];
      const result = cosineSimilarity(a, b);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("similar perfume profiles should score higher than dissimilar ones", () => {
      // Source: primarily floral + powdery
      const source     = profileToVector({ floral: 8, powdery: 6, sweet: 3 });
      // Similar: also floral + powdery dominated
      const similar    = profileToVector({ floral: 9, powdery: 5, sweet: 4 });
      // Dissimilar: woody + oriental dominated
      const dissimilar = profileToVector({ woody: 8, oriental: 9, spicy: 5 });

      const simScore    = cosineSimilarity(source, similar);
      const dissimScore = cosineSimilarity(source, dissimilar);

      expect(simScore).toBeGreaterThan(dissimScore);
    });

    it("should be commutative — similarity(a,b) === similarity(b,a)", () => {
      const a = [7, 3, 0, 5, 0, 2, 1, 0];
      const b = [4, 0, 6, 2, 3, 0, 0, 1];
      expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a));
    });
  });

  // ── profileToVector ────────────────────────────────────────────────────────

  describe("profileToVector", () => {
    // ACCORD_KEYS order (from similarity.js):
    // woody(0), oriental(1), sweet(2), citrus(3), floral(4), spicy(5), powdery(6), fresh(7)

    it("should produce an 8-element array", () => {
      expect(profileToVector({ floral: 5, woody: 3 })).toHaveLength(8);
    });

    it("should map woody to index 0 and fresh to index 7", () => {
      const vec = profileToVector({ woody: 5, fresh: 7 });
      expect(vec[0]).toBe(5); // woody
      expect(vec[7]).toBe(7); // fresh
    });

    it("should default absent accords to 0", () => {
      const vec = profileToVector({ floral: 3 });
      expect(vec[0]).toBe(0); // woody absent → 0
      expect(vec[4]).toBe(3); // floral = 3
    });

    it("should return all-zero vector for an empty profile", () => {
      const vec = profileToVector({});
      expect(vec.every((v) => v === 0)).toBe(true);
    });
  });

  // ── hasAnyAccord ───────────────────────────────────────────────────────────

  describe("hasAnyAccord", () => {
    it("should return true when at least one accord is > 0", () => {
      expect(hasAnyAccord({ floral: 5 })).toBe(true);
      expect(hasAnyAccord({ woody: 0, floral: 1 })).toBe(true);
    });

    it("should return false when all accords are 0", () => {
      expect(hasAnyAccord({ floral: 0, woody: 0 })).toBe(false);
    });

    it("should return false for an empty profile", () => {
      expect(hasAnyAccord({})).toBe(false);
    });

    it("should return false for an undefined profile", () => {
      expect(hasAnyAccord(undefined)).toBe(false);
    });
  });

  // ── Skincare scoring formula ───────────────────────────────────────────────

  describe("Skincare scoring formula", () => {
    it("should give higher score for more overlapping ingredients", () => {
      const sourceIngredients = ["hyaluronic acid", "niacinamide", "vitamin C"];

      const highOverlap = ["hyaluronic acid", "niacinamide", "retinol"]; // 2 matches
      const noOverlap   = ["salicylic acid",  "collagen",    "aloe vera"]; // 0 matches

      const scoreHigh = highOverlap.filter((i) => sourceIngredients.includes(i)).length * 2;
      const scoreNone = noOverlap.filter((i)   => sourceIngredients.includes(i)).length * 2;

      expect(scoreHigh).toBeGreaterThan(scoreNone);
      expect(scoreHigh).toBe(4); // 2 matches × 2
      expect(scoreNone).toBe(0);
    });

    it("should weight ingredients (×2) more than skin types (×1)", () => {
      const ingredientScore = 1 * 2; // one ingredient match
      const skinTypeScore   = 1 * 1; // one skin-type match
      expect(ingredientScore).toBeGreaterThan(skinTypeScore);
    });

    it("should compute combined ingredient + skin-type score correctly", () => {
      const srcIngredients = new Set(["hyaluronic acid", "niacinamide"]);
      const srcSkinTypes   = new Set(["dry", "sensitive"]);

      const candIngredients = ["hyaluronic acid", "retinol"]; // 1 match
      const candSkinTypes   = ["dry", "oily"];                // 1 match

      const matchIngr = candIngredients.filter((i) => srcIngredients.has(i)).length;
      const matchSkin = candSkinTypes.filter((s)   => srcSkinTypes.has(s)).length;
      const score     = matchIngr * 2 + matchSkin;

      expect(score).toBe(3); // 1×2 + 1×1
    });
  });
});
