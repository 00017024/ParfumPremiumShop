const request = require("supertest");
const app = require("../server");
const Product = require("../models/Product");

describe("Order API", () => {
  let userToken;
  let productId;

  beforeEach(async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "test123",
        phone: "+998991234567"
      });
    userToken = res.body.token;

    const product = await Product.create({
      name: "Test Perfume",
      brand: "Test Brand",
      price: 100,
      stock: 10
    });
    productId = product._id;

    await request(app)
      .post("/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2 });
  });

  describe("POST /orders", () => {
    it("should create order from cart", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.totalPrice).toBe(200);
      expect(res.body.status).toBe("PENDING");
    });

    it("should require authentication", async () => {
      const res = await request(app).post("/orders");
      expect(res.statusCode).toBe(401);
    });

    it("should fail with empty cart", async () => {
      await request(app)
        .delete("/cart/clear")
        .set("Authorization", `Bearer ${userToken}`);

      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("empty");
    });
  });

  describe("GET /orders/my", () => {
    it("should return user orders", async () => {
      await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`);

      const res = await request(app)
        .get("/orders/my")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });
});