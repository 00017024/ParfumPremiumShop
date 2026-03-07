const request = require("supertest");
const app = require("../server");
const User = require("../models/User");

describe("Auth API", () => {
  // Generate a unique test user per test run to avoid collisions
  let testUser;
  let authToken;

  const makeTestUser = () => {
    const stamp = Date.now() + Math.floor(Math.random() * 1000);
    return {
      name: "Test User",
      email: `testuser+${stamp}@example.com`,
      password: "password123",
      // produce a valid phone number matching +998XXXXXXXXX pattern
      phone: `+998${String(stamp % 1000000000).padStart(9, "0")}`
    };
  };

  beforeEach(() => {
    testUser = makeTestUser();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("should reject registration with existing email", async () => {
      await request(app).post("/auth/register").send(testUser);

      const res = await request(app)
        .post("/auth/register")
        .send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("already in use");
    });

    it("should reject registration with invalid phone", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({
          ...testUser,
          phone: "123"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("phone");
    });

    it("should make first user an admin", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).toBe("admin");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/auth/register").send(testUser);
    });

    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe(testUser.email);

      authToken = res.body.token;
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Invalid credentials");
    });

    it("should reject login with non-existent email", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: testUser.password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Invalid credentials");
    });
  });

  describe("Protected Routes", () => {
    beforeEach(async () => {
      const res = await request(app)
        .post("/auth/register")
        .send(testUser);
      authToken = res.body.token;
    });

    it("should block access without token", async () => {
      const res = await request(app).get("/users/profile");
      expect(res.statusCode).toBe(401);
    });

    it("should allow access with valid token", async () => {
      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toBeDefined();
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", "Bearer invalid_token");

      expect(res.statusCode).toBe(401);
    });
  });
});