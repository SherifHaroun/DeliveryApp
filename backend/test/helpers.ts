import bcrypt from "bcrypt";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/jwt.js";

export const app = createApp();

export async function resetDb() {
  await prisma.activity.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.card.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
}

export async function createCourier(email: string, password = "TestPass123", fullName = "Test Courier") {
  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      fullName,
      role: "COURIER",
    },
  });
}

export async function createCustomer(fullName = "Nour El-Sayed") {
  return prisma.customer.create({
    data: {
      fullName,
      email: `${fullName.replace(/\s+/g, ".").toLowerCase()}.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`,
      phone: "+20 100 000 0000",
      address: "14 Nile Corniche, Maadi",
      city: "Cairo",
    },
  });
}

export async function createCard(options: {
  customerId: string;
  identifier: string;
  qrToken?: string;
  status?: string;
  courierId?: string | null;
}) {
  return prisma.card.create({
    data: {
      identifier: options.identifier,
      qrToken: options.qrToken ?? options.identifier,
      last4: options.identifier.slice(-4).padStart(4, "0"),
      cardType: "Debit",
      status: options.status ?? "PENDING",
      customerId: options.customerId,
      courierId: options.courierId ?? null,
      scannedAt: options.status && options.status !== "PENDING" ? new Date() : null,
    },
  });
}

export function authHeader(user: { id: string; email: string; role: string; fullName: string }) {
  return { Authorization: `Bearer ${signToken(user)}` };
}

export function api() {
  return request(app);
}

export function hasQrToken(payload: unknown) {
  return /"qrToken"\s*:/.test(JSON.stringify(payload));
}

export { prisma };
