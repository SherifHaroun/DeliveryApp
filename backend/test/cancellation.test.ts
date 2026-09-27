import { beforeEach, describe, expect, it } from "vitest";
import { api, authHeader, createCard, createCourier, createCustomer, prisma, resetDb } from "./helpers.js";

describe("delivery cancellation", () => {
  let auth: { Authorization: string };
  let cardId: string;
  beforeEach(async () => {
    await resetDb();
    const courier = await createCourier("cancel@example.com");
    const customer = await createCustomer();
    auth = authHeader(courier);
    cardId = (await createCard({ customerId: customer.id, identifier: "CANCEL001", courierId: courier.id, status: "IN_CUSTODY" })).id;
  });
  const payload = () => ({ reason: "Customer unavailable", latitude: 30.0444, longitude: 31.2357, accuracy: 15, capturedAt: new Date().toISOString() });
  it("saves evidence, invalidates OTP, reports cancellation and prevents further delivery actions", async () => {
    await api().post(`/api/deliveries/${cardId}/send-otp`).set(auth).expect(200);
    const otp = await prisma.otp.findFirstOrThrow({ where: { cardId } });
    const response = await api().post(`/api/deliveries/${cardId}/cancel`).set(auth).send(payload()).expect(200);
    expect(response.body.status).toBe("CANCELLED");
    expect(response.body.cancellation).toMatchObject({ reason: "Customer unavailable", latitude: 30.0444, accuracy: 15, customerAddress: "14 Nile Corniche, Maadi" });
    expect((await prisma.otp.findUniqueOrThrow({ where: { id: otp.id } })).invalidatedAt).not.toBeNull();
    await api().post(`/api/deliveries/${cardId}/send-otp`).set(auth).expect(400);
    await api().post(`/api/deliveries/${cardId}/verify-otp`).set(auth).send({ code: otp.codeHash }).expect(400);
    await api().post("/api/scan/custody").set(auth).send({ qrToken: "CANCEL001" }).expect(400);
    await api().post(`/api/deliveries/${cardId}/cancel`).set(auth).send(payload()).expect(409);
    const dashboard = await api().get("/api/dashboard").set(auth).expect(200);
    expect(dashboard.body).toMatchObject({ cancelled: 1, toBeDelivered: 0, delivered: 0 });
    const list = await api().get("/api/deliveries?status=CANCELLED").set(auth).expect(200);
    expect(list.body.map((card: { id: string }) => card.id)).toEqual([cardId]);
    expect(await prisma.activity.count({ where: { cardId, action: "CANCELLED" } })).toBe(1);
  });
  it("rejects missing, invalid or stale evidence without changing status", async () => {
    for (const body of [{ reason: "Absent" }, { ...payload(), latitude: 91 }, { ...payload(), reason: " " }, { ...payload(), capturedAt: new Date(Date.now() - 180000).toISOString() }]) {
      await api().post(`/api/deliveries/${cardId}/cancel`).set(auth).send(body).expect(400);
    }
    expect((await prisma.card.findUniqueOrThrow({ where: { id: cardId } })).status).toBe("IN_CUSTODY");
  });
  it("rejects other couriers and delivered cards", async () => {
    const other = authHeader(await createCourier("other@example.com"));
    await api().post(`/api/deliveries/${cardId}/cancel`).set(other).send(payload()).expect(404);
    await prisma.card.update({ where: { id: cardId }, data: { status: "DELIVERED" } });
    await api().post(`/api/deliveries/${cardId}/cancel`).set(auth).send(payload()).expect(409);
    expect((await prisma.card.findUniqueOrThrow({ where: { id: cardId } })).status).toBe("DELIVERED");
  });
});
