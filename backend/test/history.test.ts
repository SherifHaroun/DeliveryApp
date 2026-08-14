import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  api,
  authHeader,
  createCard,
  createCourier,
  createCustomer,
  hasQrToken,
  prisma,
  resetDb,
} from "./helpers.js";

describe("history", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it("returns courier-scoped activity with cardId and without qrToken", async () => {
    const courierA = await createCourier(`hist.a.${Date.now()}@example.com`, "TestPass123", "Courier A");
    const courierB = await createCourier(`hist.b.${Date.now()}@example.com`, "TestPass123", "Courier B");
    const customer = await createCustomer("Salma Adel");
    const cardA = await createCard({
      customerId: customer.id,
      identifier: "H-A-1",
      qrToken: "SECRET-HISTORY-QR",
      status: "IN_CUSTODY",
      courierId: courierA.id,
    });
    const cardB = await createCard({
      customerId: customer.id,
      identifier: "H-B-1",
      status: "IN_CUSTODY",
      courierId: courierB.id,
    });

    await prisma.activity.create({
      data: {
        cardId: cardA.id,
        courierId: courierA.id,
        action: "TAKEN_INTO_CUSTODY",
        message: "Card H-A-1 taken into custody",
      },
    });
    await prisma.activity.create({
      data: {
        cardId: cardB.id,
        courierId: courierB.id,
        action: "TAKEN_INTO_CUSTODY",
        message: "Card H-B-1 taken into custody",
      },
    });

    const res = await api().get("/api/history").set(authHeader(courierA));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cardId).toBe(cardA.id);
    expect(res.body[0].cardIdentifier).toBe("H-A-1");
    expect(res.body[0].action).toBe("TAKEN_INTO_CUSTODY");
    expect(hasQrToken(res.body)).toBe(false);

    const unauth = await api().get("/api/history");
    expect(unauth.status).toBe(401);
  });
});
