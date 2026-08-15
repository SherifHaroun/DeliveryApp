import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api, authHeader, createCard, createCourier, createCustomer, prisma, resetDb } from "./helpers.js";

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

  it("returns each card identifier only once with the latest activity and current status", async () => {
    const courier = await createCourier(`dash.${Date.now()}@example.com`, "TestPass123", "Courier Dash");
    const customer = await createCustomer("Laila Mostafa");
    const auth = authHeader(courier);

    const cardFive = await createCard({
      customerId: customer.id,
      identifier: "C00005",
      status: "DELIVERED",
      courierId: courier.id,
    });
    const cardNine = await createCard({
      customerId: customer.id,
      identifier: "C00009",
      status: "IN_CUSTODY",
      courierId: courier.id,
    });

    await prisma.activity.createMany({
      data: [
        {
          cardId: cardFive.id,
          courierId: courier.id,
          action: "QR_SCANNED",
          message: "Scanned C00005",
          createdAt: new Date("2026-08-15T00:00:00.000Z"),
        },
        {
          cardId: cardFive.id,
          courierId: courier.id,
          action: "OTP_SENT",
          message: "OTP sent for C00005",
          createdAt: new Date("2026-08-15T00:10:00.000Z"),
        },
        {
          cardId: cardFive.id,
          courierId: courier.id,
          action: "DELIVERED",
          message: "Delivery completed for C00005",
          createdAt: new Date("2026-08-15T00:20:00.000Z"),
        },
        {
          cardId: cardNine.id,
          courierId: courier.id,
          action: "QR_SCANNED",
          message: "Scanned C00009",
          createdAt: new Date("2026-08-15T00:30:00.000Z"),
        },
        {
          cardId: cardNine.id,
          courierId: courier.id,
          action: "TAKEN_INTO_CUSTODY",
          message: "C00009 in custody",
          createdAt: new Date("2026-08-15T00:37:00.000Z"),
        },
      ],
    });

    const res = await api().get("/api/dashboard").set(auth);
    expect(res.status).toBe(200);

    const identifiers = res.body.recentActivity.map((item: { identifier: string }) => item.identifier);
    expect(identifiers).toEqual(["C00009", "C00005"]);
    expect(new Set(identifiers).size).toBe(identifiers.length);

    expect(res.body.recentActivity[0]).toMatchObject({
      cardId: cardNine.id,
      identifier: "C00009",
      status: "IN_CUSTODY",
    });
    expect(new Date(res.body.recentActivity[0].createdAt).toISOString()).toBe("2026-08-15T00:37:00.000Z");

    expect(res.body.recentActivity[1]).toMatchObject({
      cardId: cardFive.id,
      identifier: "C00005",
      status: "DELIVERED",
    });
    expect(new Date(res.body.recentActivity[1].createdAt).toISOString()).toBe("2026-08-15T00:20:00.000Z");
  });
});
