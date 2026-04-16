const request = require("supertest");
const app = require("../server");
const Product = require("../models/Product");

describe("Product API", () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    const adminRes = await request(app)
      .post("/auth/register")
      .send({
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        phone: "+998991234567"
      });
    adminToken = adminRes.body.token;

    const userRes = await request(app)
      .post("/auth/register")
      .send({
        name: "Regular User",
        email: "user@example.com",
        password: "user123",
        phone: "+998991234568"
      });
    userToken = userRes.body.token;

    await Product.create([
      {
        name: "Chanel No. 5",
        brand: "Chanel",
        price: 150,
        description: "Classic fragrance",
        stock: 10
      },
      {
        name: "Dior Sauvage",
        brand: "Dior",
        price: 120,
        description: "Fresh and woody",
        stock: 15
      }
    ]);
  });

  describe("GET /products", () => {
    it("should return all products", async () => {
      const res = await request(app).get("/products");

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it("should support search by name", async () => {
      const res = await request(app).get("/products?search=Chanel");

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].name).toContain("Chanel");
    });

    it("should support pagination", async () => {
      const res = await request(app).get("/products?page=1&limit=1");

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.pages).toBe(2);
    });

    it("should support sorting", async () => {
      const res = await request(app)
        .get("/products?sort=price&order=asc");

      expect(res.statusCode).toBe(200);
      expect(res.body.products[0].price).toBeLessThanOrEqual(
        res.body.products[1].price
      );
    });
  });

  describe("GET /products/:id", () => {
    it("should return a single product", async () => {
      const product = await Product.findOne();
      const res = await request(app).get(`/products/${product._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(product.name);
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app).get(`/products/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /products (Admin Only)", () => {
    const newProduct = {
      name: "Versace Eros",
      brand: "Versace",
      price: 100,
      description: "Bold and confident",
      stock: 20,
      type: "perfume",
      perfumeProfile: { woody: 6, oriental: 4, fresh: 2 }
    };

    it("should allow admin to create product", async () => {
      const res = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newProduct);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe(newProduct.name);
    });

    it("should reject non-admin user", async () => {
      const res = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newProduct);

      expect(res.statusCode).toBe(403);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app)
        .post("/products")
        .send(newProduct);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /products/:id (Admin Only)", () => {
    it("should allow admin to update product", async () => {
      const product = await Product.findOne();
      const res = await request(app)
        .put(`/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ price: 200 });

      expect(res.statusCode).toBe(200);
      expect(res.body.price).toBe(200);
    });
  });

  describe("DELETE /products/:id (Admin Only)", () => {
    it("should allow admin to delete product", async () => {
      const product = await Product.findOne();
      const res = await request(app)
        .delete(`/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("deleted");

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });
});