import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api, authHeader, createCard, createCourier, createCustomer, resetDb } from "./helpers.js";

describe("courier-scoped dashboard", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it("counts only the authenticated courier's open and delivered cards", async () => {
    const courierA = await createCourier(`a.${Date.now()}@example.com`, "TestPass123", "Courier A");
    const courierB = await createCourier(`b.${Date.now()}@example.com`, "TestPass123", "Courier B");
    const customer = await createCustomer("Omar Farouk");

    await createCard({
      customerId: customer.id,
      identifier: "A-CUST-1",
      status: "IN_CUSTODY",
      courierId: courierA.id,
    });
    await createCard({
      customerId: customer.id,
      identifier: "A-OTP-1",
      status: "OTP_SENT",
      courierId: courierA.id,
    });
    await createCard({
      customerId: customer.id,
      identifier: "A-OTP-2",
      status: "OTP_SENT",
      courierId: courierA.id,
    });
    await createCard({
      customerId: customer.id,
      identifier: "A-DEL-1",
      status: "DELIVERED",
      courierId: courierA.id,
    });
    await createCard({
      customerId: customer.id,
      identifier: "B-CUST-1",
      status: "IN_CUSTODY",
      courierId: courierB.id,
    });
    await createCard({
      customerId: customer.id,
      identifier: "B-CUST-2",
      status: "IN_CUSTODY",
      courierId: courierB.id,
    });
    await createCard({
      customerId: customer.id,
      identifier: "B-DEL-1",
      status: "DELIVERED",
      courierId: courierB.id,
    });
    await createCard({
      customerId: customer.id,
      identifier: "PENDING-1",
      status: "PENDING",
    });

    const authA = authHeader(courierA);
    const authB = authHeader(courierB);
    const resA = await api().get("/api/dashboard").set(authA);
    const resB = await api().get("/api/dashboard").set(authB);

    expect(resA.status).toBe(200);
    expect(resA.body.toBeDelivered).toBe(3);
    expect(resA.body.inCustody).toBe(3);
    expect(resA.body.delivered).toBe(1);
    expect(resB.body.toBeDelivered).toBe(2);
    expect(resB.body.inCustody).toBe(2);
    expect(resB.body.delivered).toBe(1);

    const [aCustody, aOtp, aDelivered, bCustody, bOtp, bDelivered] = await Promise.all([
      api().get("/api/deliveries?status=IN_CUSTODY").set(authA),
      api().get("/api/deliveries?status=OTP_SENT").set(authA),
      api().get("/api/deliveries?status=DELIVERED").set(authA),
      api().get("/api/deliveries?status=IN_CUSTODY").set(authB),
      api().get("/api/deliveries?status=OTP_SENT").set(authB),
      api().get("/api/deliveries?status=DELIVERED").set(authB),
    ]);

    expect(aCustody.body.map((card: { identifier: string }) => card.identifier)).toEqual(["A-CUST-1"]);
    expect(aOtp.body.map((card: { identifier: string }) => card.identifier).sort()).toEqual(["A-OTP-1", "A-OTP-2"]);
    expect(aDelivered.body.map((card: { identifier: string }) => card.identifier)).toEqual(["A-DEL-1"]);
    expect(bCustody.body.map((card: { identifier: string }) => card.identifier).sort()).toEqual([
      "B-CUST-1",
      "B-CUST-2",
    ]);
    expect(bOtp.body).toEqual([]);
    expect(bDelivered.body.map((card: { identifier: string }) => card.identifier)).toEqual(["B-DEL-1"]);
  });
});
