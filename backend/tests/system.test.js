"use strict";

/**
 * System Test — Full Order Flow
 *
 * Simulates the complete purchase flow a real user would follow:
 *   1. Fetch a product (GET /products/:id)
 *   2. Simulate adding to cart (in-memory — no cart endpoint exists)
 *   3. Create an order   (POST /orders)
 *   4. Verify the order  (GET  /orders/:id)
 *
 * Also tests error paths critical for report proof:
 *   - Order with non-existent product → 404 PRODUCT_NOT_FOUND
 *   - Order exceeding stock           → 400 INSUFFICIENT_STOCK
 */

const request = require("supertest");
const app     = require("../server");
const Product = require("../models/Product");

describe("System Test — Full Order Flow", () => {
  let userToken;
  let testProductId;
  const INITIAL_STOCK = 10;
  const ORDER_QTY     = 2;

  beforeEach(async () => {
    // The first registered user automatically becomes admin.
    // Register admin first so the second registration (customer) gets role=user.
    await request(app).post("/auth/register").send({
      name: "Shop Admin",
      email: "admin@system.com",
      password: "admin123",
      phone: "+998991234567",
    });

    const userRes = await request(app).post("/auth/register").send({
      name: "Customer",
      email: "customer@system.com",
      password: "customer123",
      phone: "+998991234568",
    });
    userToken = userRes.body.token;

    // Seed a product directly so the test doesn't depend on the admin create flow
    const product = await Product.create({
      name: "Chanel No. 5",
      brand: "Chanel",
      price: 150,
      stock: INITIAL_STOCK,
      type: "perfume",
      perfumeProfile: { floral: 8, powdery: 6 },
    });
    testProductId = product._id.toString();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Happy path
  // ─────────────────────────────────────────────────────────────────────────

  it("should complete the full flow: fetch → cart → order → verify", async () => {
    // ── Step 1: Fetch the product ────────────────────────────────────────
    const productRes = await request(app).get(`/products/${testProductId}`);

    expect(productRes.statusCode).toBe(200);
    expect(productRes.body.name).toBe("Chanel No. 5");
    expect(productRes.body.stock).toBe(INITIAL_STOCK);
    expect(productRes.body.price).toBe(150);

    const { price } = productRes.body;

    // ── Step 2: Simulate adding to cart (client-side state) ──────────────
    // The system has no dedicated cart endpoint; the cart lives in the client.
    // We model it here as a plain array matching the POST /orders items format.
    const cart = [{ productId: testProductId, quantity: ORDER_QTY }];
    const expectedTotal = price * ORDER_QTY; // 150 × 2 = 300

    // ── Step 3: Create the order ─────────────────────────────────────────
    const orderRes = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items:        cart,
        customerName: "Customer",
        phone:        "+998901234567",
        city:         "Tashkent",
        address:      "123 Main Street, Chilanzar",
      });

    expect(orderRes.statusCode).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.order.status).toBe("PENDING");
    expect(orderRes.body.order.totalPrice).toBe(expectedTotal);
    expect(orderRes.body.order.items).toHaveLength(1);
    expect(orderRes.body.order.customerName).toBe("Customer");
    expect(orderRes.body.order.city).toBe("Tashkent");

    const orderId = orderRes.body.order._id;

    // ── Step 4: Verify the order is persisted ────────────────────────────
    const verifyRes = await request(app)
      .get(`/orders/${orderId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body._id).toBe(orderId);
    expect(verifyRes.body.totalPrice).toBe(expectedTotal);
    expect(verifyRes.body.items).toHaveLength(1);
    expect(verifyRes.body.status).toBe("PENDING");

    // ── Bonus: confirm stock was decremented in the database ─────────────
    const updatedProduct = await Product.findById(testProductId);
    expect(updatedProduct.stock).toBe(INITIAL_STOCK - ORDER_QTY); // 10 - 2 = 8
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Multi-item order
  // ─────────────────────────────────────────────────────────────────────────

  it("should create an order with multiple different products", async () => {
    const product2 = await Product.create({
      name: "Dior Sauvage",
      brand: "Dior",
      price: 120,
      stock: 5,
      type: "perfume",
      perfumeProfile: { woody: 7, fresh: 5 },
    });

    const orderRes = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items: [
          { productId: testProductId,               quantity: 1 },
          { productId: product2._id.toString(),     quantity: 2 },
        ],
        customerName: "Customer",
        phone:        "+998901234567",
        city:         "Samarkand",
        address:      "45 Palace Road",
      });

    expect(orderRes.statusCode).toBe(201);
    expect(orderRes.body.order.items).toHaveLength(2);
    // 150×1 + 120×2 = 390
    expect(orderRes.body.order.totalPrice).toBe(390);
    expect(orderRes.body.order.city).toBe("Samarkand");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error paths
  // ─────────────────────────────────────────────────────────────────────────

  it("should fail with 404 when ordering a non-existent product", async () => {
    const fakeId = "507f1f77bcf86cd799439011";

    const orderRes = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items:        [{ productId: fakeId, quantity: 1 }],
        customerName: "Customer",
        phone:        "+998901234567",
        city:         "Tashkent",
        address:      "123 Main Street",
      });

    expect(orderRes.statusCode).toBe(404);
    expect(orderRes.body.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("should fail with 400 when stock is insufficient", async () => {
    const orderRes = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items:        [{ productId: testProductId, quantity: 99 }],
        customerName: "Customer",
        phone:        "+998901234567",
        city:         "Tashkent",
        address:      "123 Main Street",
      });

    expect(orderRes.statusCode).toBe(400);
    expect(orderRes.body.code).toBe("INSUFFICIENT_STOCK");

    // Verify stock was NOT modified (transaction rolled back)
    const product = await Product.findById(testProductId);
    expect(product.stock).toBe(INITIAL_STOCK);
  });

  it("should fail with 401 when placing an order without authentication", async () => {
    const orderRes = await request(app)
      .post("/orders")
      .send({
        items:        [{ productId: testProductId, quantity: 1 }],
        customerName: "Customer",
        phone:        "+998901234567",
        city:         "Tashkent",
        address:      "123 Main Street",
      });

    expect(orderRes.statusCode).toBe(401);
  });
});
