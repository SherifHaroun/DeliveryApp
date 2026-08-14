import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(
      `Missing ${name}. Set SECURITY_CHECK_EMAIL, SECURITY_CHECK_PASSWORD, SECURITY_CHECK_SECOND_EMAIL, and SECURITY_CHECK_SECOND_PASSWORD for local seeded courier accounts. Do not commit those values.`,
    );
  }
  return value;
}

const base = process.env.SECURITY_CHECK_API_URL?.trim() || "http://localhost:4100";
const loginEmail = requiredEnv("SECURITY_CHECK_EMAIL").toLowerCase();
const loginPassword = requiredEnv("SECURITY_CHECK_PASSWORD");
const secondEmail = requiredEnv("SECURITY_CHECK_SECOND_EMAIL").toLowerCase();
const secondPassword = requiredEnv("SECURITY_CHECK_SECOND_PASSWORD");

type Check = { name: string; pass: boolean; detail: string };
const results: Check[] = [];

function record(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

async function req(path: string, init: RequestInit = {}) {
  const res = await fetch(`${base}${path}`, init);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function auth(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function leakedOtp(payload: unknown) {
  const text = JSON.stringify(payload);
  return /"code"\s*:/.test(text) || /"codeHash"\s*:/.test(text);
}

function leakedQrToken(payload: unknown) {
  return /"qrToken"\s*:/.test(JSON.stringify(payload));
}

async function main() {
  const login = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: loginEmail, password: loginPassword }),
  });
  const token = login.data.token as string;
  if (!token) {
    record("Login", false, "login failed");
    throw new Error("Primary courier login failed. Check SECURITY_CHECK_EMAIL and SECURITY_CHECK_PASSWORD.");
  }
  record("Login", true, login.data.user?.fullName ?? "signed in");
  const h = auth(token);

  const sara = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: secondEmail, password: secondPassword }),
  });
  const saraToken = sara.data.token as string;
  if (!saraToken) {
    record("Second courier login", false, "login failed");
    throw new Error("Second courier login failed. Check SECURITY_CHECK_SECOND_EMAIL and SECURITY_CHECK_SECOND_PASSWORD.");
  }
  record("Second courier login", true, sara.data.user?.fullName ?? "signed in");

  const invalid = await req("/api/scan/lookup", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ qrToken: "NOT-A-REAL-QR" }),
  });
  record("Invalid QR rejected", invalid.status === 404, `${invalid.status} ${invalid.data.error}`);

  const delivered = await req("/api/scan/lookup", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ qrToken: "CIBDEL-J5Y9L0" }),
  });
  record(
    "Delivered card cannot be scanned",
    delivered.status === 400 && delivered.data.error === "Card has already been delivered.",
    `${delivered.status} ${delivered.data.error}`,
  );

  const other = await req("/api/scan/lookup", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ qrToken: "CIBDEL-M9B4Q2" }),
  });
  record(
    "Other courier card blocked",
    other.status === 409 && other.data.error === "Card is currently assigned to another courier.",
    `${other.status} ${other.data.error}`,
  );

  const pending = await prisma.card.findFirst({ where: { status: "PENDING" } });
  if (!pending) throw new Error("Need a pending card");
  const first = await req("/api/scan/custody", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ qrToken: pending.qrToken }),
  });
  const second = await req("/api/scan/custody", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ qrToken: pending.qrToken }),
  });
  const copies = await prisma.card.count({ where: { qrToken: pending.qrToken } });
  record(
    "Duplicate scan is idempotent",
    first.data.alreadyInCustody === false && second.data.alreadyInCustody === true && copies === 1,
    `copies=${copies} first=${first.data.alreadyInCustody} second=${second.data.alreadyInCustody}`,
  );

  const cardId = first.data.card.id as string;
  record("Scan → In Custody", first.data.card.status === "IN_CUSTODY", first.data.card.status);
  record(
    "Card JSON does not include qrToken",
    !leakedQrToken(first.data) && !leakedQrToken(second.data),
    leakedQrToken(first.data) || leakedQrToken(second.data) ? "leaked" : "clean",
  );

  const roleHack = await req("/api/profile", {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({ fullName: "Karim Hassan", role: "ADMIN" }),
  });
  const me = await prisma.user.findFirst({ where: { email: loginEmail } });
  record("Cannot escalate role via profile", me?.role === "COURIER" && roleHack.data.role === "COURIER", me?.role ?? "missing");

  const statusHack = await req(`/api/deliveries/${cardId}/status`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({ status: "DELIVERED" }),
  });
  record("Cannot PATCH status", statusHack.status === 403, `${statusHack.status} ${statusHack.data.error}`);

  const deliverHack = await req(`/api/deliveries/${cardId}/deliver`, { method: "POST", headers: h });
  record("Cannot mark delivered without OTP", deliverHack.status === 403, `${deliverHack.status} ${deliverHack.data.error}`);

  const histDel = await req("/api/history", { method: "DELETE", headers: h });
  const histPut = await req("/api/history", {
    method: "PUT",
    headers: h,
    body: JSON.stringify({ action: "DELIVERED" }),
  });
  record("History cannot be deleted", histDel.status === 403, `${histDel.status} ${histDel.data.error}`);
  record("History cannot be overwritten", histPut.status === 403, `${histPut.status} ${histPut.data.error}`);

  const send = await req(`/api/deliveries/${cardId}/send-otp`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ email: "attacker@evil.com", to: "attacker@evil.com", code: "999999" }),
  });
  const sendText = JSON.stringify(send.data);
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: (await prisma.card.findUniqueOrThrow({ where: { id: cardId } })).customerId },
  });
  record("Send OTP → OTP Sent", send.status === 200 && send.data.card.status === "OTP_SENT", send.data.card.status);
  record("OTP not in API response", !leakedOtp(send.data) && !/\b\d{6}\b/.test(sendText), leakedOtp(send.data) ? "leaked" : "clean");
  record(
    "OTP destination is registered customer email only",
    String(send.data.card.customer.email).includes("*") &&
      String(send.data.card.otp.destination).includes("*") &&
      !sendText.includes("attacker@evil.com") &&
      !sendText.includes(customer.email),
    `${send.data.card.customer.email} / ${send.data.card.otp?.destination}`,
  );

  const resend = await req(`/api/deliveries/${cardId}/send-otp`, { method: "POST", headers: h });
  record("OTP resend limited", resend.status === 429, `${resend.status} ${resend.data.error}`);

  const wrong = await req(`/api/deliveries/${cardId}/verify-otp`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ code: "000000" }),
  });
  const afterWrong = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  record(
    "Incorrect OTP does not deliver",
    wrong.status === 400 && afterWrong.status === "OTP_SENT",
    `${wrong.status} ${afterWrong.status} remaining=${wrong.data.attemptsRemaining}`,
  );

  const otpRow = await prisma.otp.findFirst({
    where: { cardId, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otpRow) throw new Error("OTP missing");

  await prisma.otp.update({
    where: { id: otpRow.id },
    data: { expiresAt: new Date(Date.now() - 1000), codeHash: "111111" },
  });
  const expired = await req(`/api/deliveries/${cardId}/verify-otp`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ code: "111111" }),
  });
  const afterExpired = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  record(
    "Expired OTP does not deliver",
    expired.status === 400 && String(expired.data.error).toLowerCase().includes("expired") && afterExpired.status === "OTP_SENT",
    `${expired.status} ${expired.data.error} ${afterExpired.status}`,
  );

  await prisma.otp.update({
    where: { id: otpRow.id },
    data: { expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0, invalidatedAt: null, verifiedAt: null, codeHash: "222222" },
  });
  await prisma.card.update({ where: { id: cardId }, data: { status: "OTP_SENT" } });

  let lastAttempt = { status: 0, data: { error: "", attemptsRemaining: 0 } };
  for (let i = 0; i < 5; i += 1) {
    lastAttempt = await req(`/api/deliveries/${cardId}/verify-otp`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ code: "000000" }),
    });
  }
  const lockedCard = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  record(
    "OTP attempts limited",
    lastAttempt.status === 400 && lockedCard.status === "OTP_SENT" && (lastAttempt.data.attemptsRemaining === 0 || String(lastAttempt.data.error).includes("Too many")),
    `${lastAttempt.data.error} remaining=${lastAttempt.data.attemptsRemaining} status=${lockedCard.status}`,
  );

  const custodyCard = await prisma.card.findFirst({
    where: { courierId: me!.id, status: "IN_CUSTODY" },
  });
  if (!custodyCard) throw new Error("Need another in-custody card");
  const send2 = await req(`/api/deliveries/${custodyCard.id}/send-otp`, { method: "POST", headers: h });
  const liveOtp = await prisma.otp.findFirst({
    where: { cardId: custodyCard.id, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
  });
  await prisma.otp.update({ where: { id: liveOtp!.id }, data: { codeHash: "482913" } });
  const ok = await req(`/api/deliveries/${custodyCard.id}/verify-otp`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ code: "482913" }),
  });
  record(
    "Correct OTP → Delivered",
    ok.status === 200 && ok.data.status === "DELIVERED" && Boolean(ok.data.deliveredAt) && !leakedOtp(ok.data),
    `${ok.status} ${ok.data.status}`,
  );

  const reuse = await req(`/api/deliveries/${custodyCard.id}/verify-otp`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ code: "482913" }),
  });
  record("Used OTP cannot be reused", reuse.status === 400, `${reuse.status} ${reuse.data.error}`);

  const activities = await prisma.activity.findMany({
    where: { cardId: custodyCard.id },
    orderBy: { createdAt: "asc" },
  });
  const actions = activities.map((a) => a.action);
  record(
    "Important actions recorded",
    actions.includes("OTP_SENT") && actions.includes("OTP_VERIFIED") && actions.includes("DELIVERED"),
    actions.join(", "),
  );

  const report = await req("/api/stats/delivered-count", { headers: h });
  const keys = Object.keys(report.data).sort().join(",");
  record(
    "Reporting payload is delivered count only",
    report.status === 200 && keys === "deliveredCount,generatedAt",
    keys,
  );

  const saraTake = await req("/api/scan/custody", {
    method: "POST",
    headers: auth(saraToken),
    body: JSON.stringify({ qrToken: pending.qrToken }),
  });
  record(
    "Other courier cannot take assigned card",
    saraTake.status === 409,
    `${saraTake.status} ${saraTake.data.error}`,
  );

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
