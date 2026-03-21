const request = require("supertest");
const app = require("../server");
const Product = require("../models/Product");

describe("Order API", () => {
  let userToken;
  let adminToken;
  let productId;
  let productId2;

  const testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "test123",
    phone: "+998901234567"
  };

  const testAdmin = {
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    phone: "+998901234568"
  };

  const validOrderPayload = () => ({
    items: [{ productId: productId.toString(), quantity: 2 }],
    customerName: "Test User",
    phone: "+998901234567",
    city: "Tashkent",
    address: "123 Test Street, Chilanzar"
  });

  beforeEach(async () => {
    // First registered user becomes admin
    const adminRes = await request(app)
      .post("/auth/register")
      .send(testAdmin);
    adminToken = adminRes.body.token;

    const userRes = await request(app)
      .post("/auth/register")
      .send(testUser);
    userToken = userRes.body.token;

    const product = await Product.create({
      name: "Chanel No. 5",
      brand: "Chanel",
      price: 100,
      stock: 10
    });
    productId = product._id;

    const product2 = await Product.create({
      name: "Dior Sauvage",
      brand: "Dior",
      price: 80,
      stock: 5
    });
    productId2 = product2._id;
  });

  // ─────────────────────────────────────────────────────────────
  // POST /orders
  // ─────────────────────────────────────────────────────────────

  describe("POST /orders", () => {
    it("should create an order successfully", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validOrderPayload());

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.items).toHaveLength(1);
      expect(res.body.order.totalPrice).toBe(200);
      expect(res.body.order.status).toBe("PENDING");
      expect(res.body.order.customerName).toBe("Test User");
      expect(res.body.order.city).toBe("Tashkent");
    });

    it("should decrement product stock after order", async () => {
      await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validOrderPayload());

      const updated = await Product.findById(productId);
      expect(updated.stock).toBe(8); // 10 - 2
    });

    it("should create an order with multiple items", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          ...validOrderPayload(),
          items: [
            { productId: productId.toString(), quantity: 2 },
            { productId: productId2.toString(), quantity: 1 }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.order.items).toHaveLength(2);
      expect(res.body.order.totalPrice).toBe(280); // (100*2) + (80*1)
    });

    it("should accept Samarkand as a valid city", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ ...validOrderPayload(), city: "Samarkand" });

      expect(res.statusCode).toBe(201);
      expect(res.body.order.city).toBe("Samarkand");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/orders")
        .send(validOrderPayload());

      expect(res.statusCode).toBe(401);
    });

    it("should reject order with missing items", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ ...validOrderPayload(), items: [] });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe("ORDER_ITEMS_MISSING");
    });

    it("should reject order with missing customer details", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          items: [{ productId: productId.toString(), quantity: 1 }]
          // no customerName, phone, city, address
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe("CUSTOMER_DETAILS_MISSING");
    });

    it("should reject order with invalid city", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ ...validOrderPayload(), city: "Bukhara" });

      expect(res.statusCode).toBe(500); // Mongoose enum validation
    });

    it("should reject order when stock is insufficient", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          ...validOrderPayload(),
          items: [{ productId: productId.toString(), quantity: 99 }]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe("INSUFFICIENT_STOCK");
    });

    it("should reject order with non-existent product", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          ...validOrderPayload(),
          items: [{ productId: fakeId, quantity: 1 }]
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe("PRODUCT_NOT_FOUND");
    });

    it("should reject order with invalid quantity (zero)", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          ...validOrderPayload(),
          items: [{ productId: productId.toString(), quantity: 0 }]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe("INVALID_QUANTITY");
    });

    it("should reject order with invalid quantity (float)", async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          ...validOrderPayload(),
          items: [{ productId: productId.toString(), quantity: 1.5 }]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe("INVALID_QUANTITY");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET /orders/my
  // ─────────────────────────────────────────────────────────────

  describe("GET /orders/my", () => {
    it("should return orders belonging to the authenticated user", async () => {
      await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validOrderPayload());

      const res = await request(app)
        .get("/orders/my")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe("PENDING");
    });

    it("should return empty array when user has no orders", async () => {
      const res = await request(app)
        .get("/orders/my")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it("should not return other users orders", async () => {
      // userToken places an order
      await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validOrderPayload());

      // adminToken checks their own orders — should see none
      const res = await request(app)
        .get("/orders/my")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/orders/my");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET /orders/:id
  // ─────────────────────────────────────────────────────────────

  describe("GET /orders/:id", () => {
    let orderId;

    beforeEach(async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validOrderPayload());
      orderId = res.body.order._id;
    });

    it("should return the order for its owner", async () => {
      const res = await request(app)
        .get(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(orderId);
    });

    it("should allow admin to view any order", async () => {
      const res = await request(app)
        .get(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(orderId);
    });

    it("should return 404 for non-existent order", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .get(`/orders/${fakeId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });

    it("should require authentication", async () => {
      const res = await request(app).get(`/orders/${orderId}`);
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET /orders (Admin only)
  // ─────────────────────────────────────────────────────────────

  describe("GET /orders (admin)", () => {
    it("should return all orders for admin", async () => {
      await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validOrderPayload());

      const res = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should reject non-admin user", async () => {
      const res = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/orders");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PUT /orders/:id/status (Admin only)
  // ─────────────────────────────────────────────────────────────

  describe("PUT /orders/:id/status (admin)", () => {
    let orderId;

    beforeEach(async () => {
      const res = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validOrderPayload());
      orderId = res.body.order._id;
    });

    it("should allow admin to transition PENDING → PAID", async () => {
      const res = await request(app)
        .put(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "PAID" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("PAID");
    });

    it("should allow admin to transition PENDING → CANCELLED", async () => {
      const res = await request(app)
        .put(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "CANCELLED" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("CANCELLED");
    });

    it("should reject invalid status transition (PENDING → COMPLETED)", async () => {
      const res = await request(app)
        .put(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "COMPLETED" });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("should reject invalid status value", async () => {
      const res = await request(app)
        .put(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "SHIPPED" });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-admin user", async () => {
      const res = await request(app)
        .put(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "PAID" });

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 for non-existent order", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .put(`/orders/${fakeId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "PAID" });

      expect(res.statusCode).toBe(404);
    });
  });
});