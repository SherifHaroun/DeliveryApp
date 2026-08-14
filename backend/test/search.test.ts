import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api, authHeader, createCard, createCourier, createCustomer, prisma, resetDb } from "./helpers.js";

describe("delivery search", () => {
  let auth: { Authorization: string };
  let nour: Awaited<ReturnType<typeof createCustomer>>;
  let omar: Awaited<ReturnType<typeof createCustomer>>;

  beforeEach(async () => {
    await resetDb();
    const courier = await createCourier(`search.${Date.now()}@example.com`);
    auth = authHeader(courier);
    nour = await createCustomer("Nour El-Sayed");
    omar = await createCustomer("Omar Farouk");
    await prisma.customer.update({
      where: { id: omar.id },
      data: { city: "Giza" },
    });
    await createCard({
      customerId: nour.id,
      identifier: "C10001",
      status: "IN_CUSTODY",
      courierId: courier.id,
    });
    await createCard({
      customerId: omar.id,
      identifier: "C10002",
      status: "OTP_SENT",
      courierId: courier.id,
    });
  });

  afterEach(async () => {
    await resetDb();
  });

  it("finds a card by identifier", async () => {
    const res = await api().get("/api/deliveries?q=C10001").set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].identifier).toBe("C10001");
  });

  it("finds a card by customer name", async () => {
    const res = await api().get("/api/deliveries?q=Omar").set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customer.fullName).toBe("Omar Farouk");
  });

  it("finds a card by last4", async () => {
    const res = await api().get("/api/deliveries?q=0002").set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].identifier).toBe("C10002");
  });

  it("finds a card by customer email", async () => {
    const res = await api().get(`/api/deliveries?q=${encodeURIComponent(nour.email)}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].identifier).toBe("C10001");
  });

  it("finds a card by customer city", async () => {
    const res = await api().get("/api/deliveries?q=Giza").set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customer.fullName).toBe("Omar Farouk");
  });

  it("returns an empty list when nothing matches", async () => {
    const res = await api().get("/api/deliveries?q=NO-SUCH-CARD").set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
