import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api, createCourier, resetDb } from "./helpers.js";

describe("authentication", () => {
  const password = "TestPass123";
  let email: string;

  beforeEach(async () => {
    await resetDb();
    email = `auth.${Date.now()}@example.com`;
    await createCourier(email, password, "Auth Courier");
  });

  afterEach(async () => {
    await resetDb();
  });

  it("logs in with valid credentials", async () => {
    const res = await api().post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
  });

  it("rejects invalid credentials", async () => {
    const res = await api().post("/api/auth/login").send({ email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("rejects unauthenticated access to protected APIs", async () => {
    const res = await api().get("/api/deliveries");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid JWT with 401", async () => {
    const res = await api().get("/api/deliveries").set("Authorization", "Bearer not-a-valid-token");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/session expired|sign in/i);
  });

  it("rejects an expired JWT with 401", async () => {
    const token = jwt.sign(
      {
        id: "expired-user",
        email,
        role: "COURIER",
        fullName: "Auth Courier",
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      process.env.JWT_SECRET ?? "test-jwt-secret",
    );
    const res = await api().get("/api/deliveries").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/session expired|sign in/i);
  });
});
