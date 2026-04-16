"use strict";

/**
 * Filtering & Recommendations API Tests
 *
 * Covered endpoints:
 *   GET /products/filter/perfume
 *   GET /products/:id/recommendations
 *
 * Products are seeded directly via Mongoose (bypassing Joi) so tests stay
 * focused on the recommendation/filter logic rather than the admin create flow.
 */

const request = require("supertest");
const app     = require("../server");
const Product = require("../models/Product");

describe("Filtering & Recommendations API", () => {
  // IDs assigned in beforeEach and used across tests
  let floralPerfumeId;   // source perfume — floral/powdery
  let similarPerfumeId;  // similar to source — also floral/powdery
  // "Dark Oud" and "Hydra Serum" are created but referenced by type only

  beforeEach(async () => {
    // First registered user becomes admin (required by auth system)
    await request(app).post("/auth/register").send({
      name: "Admin",
      email: "admin@rec.com",
      password: "admin123",
      phone: "+998991234567",
    });

    // ── Perfume products ───────────────────────────────────────────────────
    const p1 = await Product.create({
      name: "Floral Dream",
      brand: "Chanel",
      price: 150,
      type: "perfume",
      stock: 10,
      perfumeProfile: { floral: 9, powdery: 6, sweet: 4 },
    });
    floralPerfumeId = p1._id.toString();

    const p2 = await Product.create({
      name: "Rose Garden",
      brand: "Dior",
      price: 130,
      type: "perfume",
      stock: 8,
      perfumeProfile: { floral: 8, powdery: 5, sweet: 3 },
    });
    similarPerfumeId = p2._id.toString();

    // Dissimilar perfume — woody / oriental focus
    await Product.create({
      name: "Dark Oud",
      brand: "Tom Ford",
      price: 200,
      type: "perfume",
      stock: 5,
      perfumeProfile: { woody: 9, oriental: 8, spicy: 6 },
    });

    // Skincare product — must NOT appear in perfume filter/recommendation results
    await Product.create({
      name: "Hydra Serum",
      brand: "CeraVe",
      price: 30,
      type: "skincare",
      stock: 20,
      skincareProfile: {
        ingredients: ["hyaluronic acid", "niacinamide"],
        skinTypes: ["dry"],
      },
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /products/filter/perfume
  // ─────────────────────────────────────────────────────────────────────────

  describe("GET /products/filter/perfume", () => {
    it("should return perfumes ranked by accord preference", async () => {
      const res = await request(app)
        .get("/products/filter/perfume?floral=9&powdery=6&sweet=4");

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toBeDefined();
      expect(res.body.total).toBeGreaterThan(0);
    });

    it("should return only perfume-type products", async () => {
      const res = await request(app)
        .get("/products/filter/perfume?floral=5");

      expect(res.statusCode).toBe(200);
      res.body.products.forEach((p) => expect(p.type).toBe("perfume"));
    });

    it("should return results even without an exact accord match (partial matching)", async () => {
      // Preference: floral=5 — no product has exactly floral=5,
      // but products with floral > 0 should still be returned via cosine similarity
      const res = await request(app)
        .get("/products/filter/perfume?floral=5");

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it("should rank the best accord match first", async () => {
      // Preference strongly matches "Floral Dream" (floral:9, powdery:6, sweet:4)
      const res = await request(app)
        .get("/products/filter/perfume?floral=9&powdery=6&sweet=4");

      expect(res.statusCode).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0]._id.toString()).toBe(floralPerfumeId);
    });

    it("should return all perfumes when no preferences are provided", async () => {
      const res = await request(app).get("/products/filter/perfume");

      expect(res.statusCode).toBe(200);
      // All 3 perfume products created in beforeEach
      expect(res.body.total).toBe(3);
    });

    it("should not include skincare products in results", async () => {
      const res = await request(app)
        .get("/products/filter/perfume?floral=5");

      expect(res.statusCode).toBe(200);
      const types = res.body.products.map((p) => p.type);
      expect(types).not.toContain("skincare");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /products/:id/recommendations
  // ─────────────────────────────────────────────────────────────────────────

  describe("GET /products/:id/recommendations", () => {
    it("should return a successful response with a data array", async () => {
      const res = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return at least one recommendation", async () => {
      const res = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should NOT include the source product in the results", async () => {
      const res = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations`);

      expect(res.statusCode).toBe(200);
      const returnedIds = res.body.data.map((p) => p._id.toString());
      expect(returnedIds).not.toContain(floralPerfumeId);
    });

    it("should rank the most similar perfume first", async () => {
      // "Rose Garden" is similar to "Floral Dream" (both floral/powdery)
      // "Dark Oud" is dissimilar (woody/oriental)
      const res = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations?limit=10`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]._id.toString()).toBe(similarPerfumeId);
    });

    it("should respect the ?limit query parameter", async () => {
      const res = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations?limit=1`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });

    it("should only include perfume products for a perfume source", async () => {
      const res = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations`);

      expect(res.statusCode).toBe(200);
      res.body.data.forEach((p) => expect(p.type).toBe("perfume"));
    });

    it("should include a similarity score on each result", async () => {
      const res = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations`);

      expect(res.statusCode).toBe(200);
      res.body.data.forEach((p) => {
        expect(typeof p.score).toBe("number");
        expect(p.score).toBeGreaterThan(0);
      });
    });

    it("should return 404 for a non-existent product ID", async () => {
      const res = await request(app)
        .get("/products/507f1f77bcf86cd799439011/recommendations");

      expect(res.statusCode).toBe(404);
    });

    it("should return consistent results for the same input (determinism)", async () => {
      const res1 = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations`);
      const res2 = await request(app)
        .get(`/products/${floralPerfumeId}/recommendations`);

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);

      const ids1 = res1.body.data.map((p) => p._id);
      const ids2 = res2.body.data.map((p) => p._id);
      expect(ids1).toEqual(ids2);
    });
  });
});
