import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendOtpNotification } from "../src/services/notification/index.js";
import { hashOtp } from "../src/lib/otp.js";
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

const sendMock = vi.mocked(sendOtpNotification);

describe("card lifecycle", () => {
  const password = "TestPass123";
  let courier: Awaited<ReturnType<typeof createCourier>>;
  let customer: Awaited<ReturnType<typeof createCustomer>>;
  let auth: { Authorization: string };

  beforeEach(async () => {
    await resetDb();
    sendMock.mockReset();
    sendMock.mockResolvedValue({ channel: "EMAIL", sent: true });
    courier = await createCourier(`life.${Date.now()}@example.com`, password, "Karim Hassan");
    customer = await createCustomer("Ahmed Salem");
    auth = authHeader(courier);
  });

  afterEach(async () => {
    await resetDb();
  });

  it("takes a pending card into courier custody and records activity", async () => {
    const card = await createCard({
      customerId: customer.id,
      identifier: "C90001",
      qrToken: "QR-C90001",
    });

    const res = await api().post("/api/scan/custody").set(auth).send({ qrToken: "QR-C90001" });

    expect(res.status).toBe(200);
    expect(res.body.card.id).toBe(card.id);
    expect(res.body.card.status).toBe("IN_CUSTODY");
    expect(res.body.alreadyInCustody).toBe(false);

    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.courierId).toBe(courier.id);
    expect(stored.status).toBe("IN_CUSTODY");
    expect(stored.scannedAt).toBeTruthy();

    const actions = (await prisma.activity.findMany({ where: { cardId: card.id } })).map((row) => row.action);
    expect(actions).toEqual(expect.arrayContaining(["QR_SCANNED", "TAKEN_INTO_CUSTODY"]));
  });

  it("rejects unauthenticated custody requests", async () => {
    await createCard({ customerId: customer.id, identifier: "C90002", qrToken: "QR-C90002" });
    const res = await api().post("/api/scan/custody").send({ qrToken: "QR-C90002" });
    expect(res.status).toBe(401);
  });

  it("rejects invalid JWT custody requests", async () => {
    await createCard({ customerId: customer.id, identifier: "C90012", qrToken: "QR-C90012" });
    const res = await api()
      .post("/api/scan/custody")
      .set("Authorization", "Bearer not-a-valid-token")
      .send({ qrToken: "QR-C90012" });
    expect(res.status).toBe(401);
  });

  it("sends an OTP without leaking the code and records activity", async () => {
    const card = await createCard({
      customerId: customer.id,
      identifier: "C90003",
      qrToken: "QR-C90003",
      status: "IN_CUSTODY",
      courierId: courier.id,
    });

    const res = await api().post(`/api/deliveries/${card.id}/send-otp`).set(auth).send({});
    expect(res.status).toBe(200);
    expect(res.body.card.status).toBe("OTP_SENT");
    expect(JSON.stringify(res.body)).not.toMatch(/"code"\s*:/);
    expect(JSON.stringify(res.body)).not.toMatch(/"codeHash"\s*:/);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].to).toBe(customer.email);
    expect(sendMock.mock.calls[0][0].code).toMatch(/^\d{6}$/);

    const otp = await prisma.otp.findFirstOrThrow({ where: { cardId: card.id } });
    expect(otp.codeHash).toBe(hashOtp(sendMock.mock.calls[0][0].code));
    expect(otp.codeHash).not.toBe(sendMock.mock.calls[0][0].code);

    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("OTP_SENT");
    expect(stored.otpSentAt).toBeTruthy();

    const actions = (await prisma.activity.findMany({ where: { cardId: card.id } })).map((row) => row.action);
    expect(actions).toContain("OTP_SENT");
  });

  it("rolls back a failed first OTP send", async () => {
    sendMock.mockRejectedValueOnce(new Error("Resend down"));
    const card = await createCard({
      customerId: customer.id,
      identifier: "C90004",
      qrToken: "QR-C90004",
      status: "IN_CUSTODY",
      courierId: courier.id,
    });

    const res = await api().post(`/api/deliveries/${card.id}/send-otp`).set(auth).send({});
    expect(res.status).toBe(502);

    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("IN_CUSTODY");
    expect(stored.otpSentAt).toBeNull();

    const otps = await prisma.otp.findMany({ where: { cardId: card.id } });
    expect(otps.length).toBeGreaterThan(0);
    expect(otps.every((otp) => otp.invalidatedAt)).toBe(true);

    const actions = (await prisma.activity.findMany({ where: { cardId: card.id } })).map((row) => row.action);
    expect(actions).not.toContain("OTP_SENT");
  });

  it("restores the previous OTP when a resend email fails", async () => {
    const card = await createCard({
      customerId: customer.id,
      identifier: "C90005",
      qrToken: "QR-C90005",
      status: "IN_CUSTODY",
      courierId: courier.id,
    });

    const first = await api().post(`/api/deliveries/${card.id}/send-otp`).set(auth).send({});
    expect(first.status).toBe(200);
    const previous = await prisma.otp.findFirstOrThrow({
      where: { cardId: card.id, invalidatedAt: null },
    });
    const previousSentAt = (await prisma.card.findUniqueOrThrow({ where: { id: card.id } })).otpSentAt;

    sendMock.mockRejectedValueOnce(new Error("Resend down"));
    const resend = await api().post(`/api/deliveries/${card.id}/send-otp`).set(auth).send({});
    expect(resend.status).toBe(502);

    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("OTP_SENT");
    expect(stored.otpSentAt?.toISOString()).toBe(previousSentAt?.toISOString());

    const restored = await prisma.otp.findUniqueOrThrow({ where: { id: previous.id } });
    expect(restored.invalidatedAt).toBeNull();

    const newest = await prisma.otp.findFirst({
      where: { cardId: card.id },
      orderBy: { createdAt: "desc" },
    });
    expect(newest?.id).not.toBe(previous.id);
    expect(newest?.invalidatedAt).toBeTruthy();
  });

  it("rejects a wrong OTP without delivering", async () => {
    const card = await createCustodyOtpCard("C90006");
    const res = await api()
      .post(`/api/deliveries/${card.id}/verify-otp`)
      .set(auth)
      .send({ code: "000000" });
    expect(res.status).toBe(400);
    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("OTP_SENT");
    expect(stored.deliveredAt).toBeNull();
  });

  it("rejects an expired OTP without delivering", async () => {
    const card = await createCustodyOtpCard("C90007");
    const otp = await prisma.otp.findFirstOrThrow({ where: { cardId: card.id, invalidatedAt: null } });
    await prisma.otp.update({
      where: { id: otp.id },
      data: { expiresAt: new Date(Date.now() - 1000), codeHash: hashOtp("111111") },
    });

    const res = await api()
      .post(`/api/deliveries/${card.id}/verify-otp`)
      .set(auth)
      .send({ code: "111111" });
    expect(res.status).toBe(400);
    expect(String(res.body.error).toLowerCase()).toContain("expired");
    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("OTP_SENT");
  });

  it("locks after too many incorrect attempts", async () => {
    const card = await createCustodyOtpCard("C90008");
    let last = { status: 0, body: { error: "" } };
    for (let i = 0; i < 5; i += 1) {
      last = await api().post(`/api/deliveries/${card.id}/verify-otp`).set(auth).send({ code: "000000" });
    }
    expect(last.status).toBe(400);

    const locked = await api()
      .post(`/api/deliveries/${card.id}/verify-otp`)
      .set(auth)
      .send({ code: "000000" });
    expect(locked.status).toBe(400);
    expect(String(locked.body.error)).toMatch(/too many incorrect attempts/i);

    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("OTP_SENT");
    expect(stored.deliveredAt).toBeNull();
  });

  it("marks the card delivered after a correct OTP", async () => {
    const card = await createCustodyOtpCard("C90009");
    await prisma.otp.updateMany({
      where: { cardId: card.id, invalidatedAt: null },
      data: { codeHash: hashOtp("482913") },
    });

    const res = await api()
      .post(`/api/deliveries/${card.id}/verify-otp`)
      .set(auth)
      .send({ code: "482913" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DELIVERED");
    expect(res.body.deliveredAt).toBeTruthy();
    expect(res.body.courier.id).toBe(courier.id);

    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("DELIVERED");
    expect(stored.deliveredAt).toBeTruthy();
    expect(stored.courierId).toBe(courier.id);

    const actions = (await prisma.activity.findMany({ where: { cardId: card.id } })).map((row) => row.action);
    expect(actions).toEqual(expect.arrayContaining(["OTP_VERIFIED", "DELIVERED"]));
  });

  it("forbids marking a card delivered without OTP", async () => {
    const card = await createCard({
      customerId: customer.id,
      identifier: "C90010",
      status: "IN_CUSTODY",
      courierId: courier.id,
    });
    const deliver = await api().post(`/api/deliveries/${card.id}/deliver`).set(auth);
    const patch = await api().patch(`/api/deliveries/${card.id}/status`).set(auth).send({ status: "DELIVERED" });
    expect(deliver.status).toBe(403);
    expect(patch.status).toBe(403);
    const stored = await prisma.card.findUniqueOrThrow({ where: { id: card.id } });
    expect(stored.status).toBe("IN_CUSTODY");
  });

  it("does not include qrToken in scan or delivery JSON", async () => {
    const card = await createCard({
      customerId: customer.id,
      identifier: "C90011",
      qrToken: "SECRET-QR-TOKEN",
      status: "IN_CUSTODY",
      courierId: courier.id,
    });
    const scan = await api().post("/api/scan/custody").set(auth).send({ qrToken: "SECRET-QR-TOKEN" });
    const list = await api().get("/api/deliveries").set(auth);
    const detail = await api().get(`/api/deliveries/${card.id}`).set(auth);
    const search = await api().get("/api/deliveries?q=C90011").set(auth);

    expect(hasQrToken(scan.body)).toBe(false);
    expect(hasQrToken(list.body)).toBe(false);
    expect(hasQrToken(detail.body)).toBe(false);
    expect(hasQrToken(search.body)).toBe(false);
    expect(scan.body.card.identifier).toBe("C90011");
  });

  async function createCustodyOtpCard(identifier: string) {
    const card = await createCard({
      customerId: customer.id,
      identifier,
      qrToken: `QR-${identifier}`,
      status: "IN_CUSTODY",
      courierId: courier.id,
    });
    const sent = await api().post(`/api/deliveries/${card.id}/send-otp`).set(auth).send({});
    expect(sent.status).toBe(200);
    return card;
  }
});
