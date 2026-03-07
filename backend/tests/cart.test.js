const request = require("supertest");
const app = require("../server");
const Product = require("../models/Product");

describe("Cart API", () => {
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
  });

  describe("POST /cart/add", () => {
    it("should add product to cart", async () => {
      const res = await request(app)
        .post("/cart/add")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId, quantity: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].quantity).toBe(2);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/cart/add")
        .send({ productId, quantity: 1 });

      expect(res.statusCode).toBe(401);
    });

    it("should reject invalid product", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .post("/cart/add")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId: fakeId, quantity: 1 });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /cart", () => {
    it("should return user cart", async () => {
      await request(app)
        .post("/cart/add")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId, quantity: 1 });

      const res = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });

    it("should return empty cart for new user", async () => {
      const res = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });
  });
});