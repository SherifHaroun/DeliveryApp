import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { DEMO_COURIER_EMAIL, ensureDemoCourier } from "../src/lib/demoUser.ts";
import { DEMO_CUSTOMERS } from "../src/lib/demoCards.ts";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await prisma.activity.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.card.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Courier123!", 10);
  const adminHash = await bcrypt.hash("Admin123!", 10);

  await ensureDemoCourier();
  const courier = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_COURIER_EMAIL } });

  const otherCourier = await prisma.user.create({
    data: {
      email: "sara@delivery.local",
      passwordHash,
      fullName: "Sara Nabil",
      phone: "+20 100 555 1300",
      role: "COURIER",
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@delivery.local",
      passwordHash: adminHash,
      fullName: "Delivery Admin",
      phone: "+20 100 555 1000",
      role: "ADMIN",
    },
  });

  const customers = await Promise.all(
    DEMO_CUSTOMERS.map((person) =>
      prisma.customer.create({
        data: {
          fullName: person.fullName,
          email: "sherief.mharoun@gmail.com",
          phone: person.phone,
          address: person.address,
          city: person.city,
        },
      }),
    ),
  );

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  const cardDefs = [
    { identifier: "C00001", last4: "0001", type: "Debit", status: "PENDING", token: "C00001", customer: 0 },
    { identifier: "C00002", last4: "0002", type: "Debit", status: "PENDING", token: "C00002", customer: 1 },
    { identifier: "C00003", last4: "0003", type: "Debit", status: "PENDING", token: "C00003", customer: 2 },
    { identifier: "C00004", last4: "0004", type: "Debit", status: "PENDING", token: "C00004", customer: 3 },
    { identifier: "C00005", last4: "0005", type: "Debit", status: "PENDING", token: "C00005", customer: 4 },
    { identifier: "C00006", last4: "0006", type: "Debit", status: "PENDING", token: "C00006", customer: 5 },
    { identifier: "C00007", last4: "0007", type: "Debit", status: "PENDING", token: "C00007", customer: 6 },
    { identifier: "C00008", last4: "0008", type: "Debit", status: "PENDING", token: "C00008", customer: 7 },
    { identifier: "C00009", last4: "0009", type: "Debit", status: "PENDING", token: "C00009", customer: 8 },
    { identifier: "C00010", last4: "0010", type: "Debit", status: "PENDING", token: "C00010", customer: 9 },
    { identifier: "CARD-1005", last4: "1108", type: "Debit", status: "IN_CUSTODY", token: "CIBDEL-E6S7Y3", customer: 4, scannedHours: 2 },
    { identifier: "CARD-1006", last4: "5566", type: "Credit", status: "IN_CUSTODY", token: "CIBDEL-F2U8Z4", customer: 5, scannedHours: 5 },
    { identifier: "CARD-1007", last4: "9023", type: "Debit", status: "OTP_SENT", token: "CIBDEL-G4V1X8", customer: 6, scannedHours: 6, otpHours: 1 },
    { identifier: "CARD-1008", last4: "3387", type: "Credit", status: "OTP_SENT", token: "CIBDEL-H8W3K5", customer: 7, scannedHours: 8, otpHours: 3 },
    { identifier: "CARD-1009", last4: "6614", type: "Debit", status: "DELIVERED", token: "CIBDEL-J5Y9L0", customer: 8, scannedHours: 28, otpHours: 26, deliveredHours: 25 },
    { identifier: "CARD-1010", last4: "2479", type: "Prepaid", status: "DELIVERED", token: "CIBDEL-K1Z6N7", customer: 9, scannedHours: 50, otpHours: 48, deliveredHours: 47 },
    { identifier: "CARD-1011", last4: "8150", type: "Debit", status: "DELIVERED", token: "CIBDEL-L3A2P4", customer: 0, scannedHours: 72, otpHours: 70, deliveredHours: 69 },
    { identifier: "CARD-1012", last4: "3901", type: "Debit", status: "IN_CUSTODY", token: "CIBDEL-M9B4Q2", customer: 1, scannedHours: 3, holder: "other" },
  ] as const;

  const qrDir = path.join(__dirname, "..", "qr-codes");
  fs.mkdirSync(qrDir, { recursive: true });

  for (const def of cardDefs) {
    const holderId = "holder" in def && def.holder === "other" ? otherCourier.id : courier.id;
    const assigned = def.status !== "PENDING";
    const card = await prisma.card.create({
      data: {
        identifier: def.identifier,
        qrToken: def.token,
        last4: def.last4,
        cardType: def.type,
        status: def.status,
        customerId: customers[def.customer].id,
        courierId: assigned ? holderId : null,
        scannedAt: "scannedHours" in def ? hoursAgo(def.scannedHours) : null,
        otpSentAt: "otpHours" in def ? hoursAgo(def.otpHours) : null,
        deliveredAt: "deliveredHours" in def ? hoursAgo(def.deliveredHours) : null,
      },
    });

    await QRCode.toFile(path.join(qrDir, `${def.token}.png`), def.token, {
      width: 360,
      margin: 2,
    });

    if (assigned) {
      const scannedAt = "scannedHours" in def ? hoursAgo(def.scannedHours) : now;
      await prisma.activity.create({
        data: {
          cardId: card.id,
          courierId: holderId,
          action: "QR_SCANNED",
          message: `QR scanned for ${def.identifier}`,
          createdAt: scannedAt,
        },
      });
      await prisma.activity.create({
        data: {
          cardId: card.id,
          courierId: holderId,
          action: "TAKEN_INTO_CUSTODY",
          message: `Card ${def.identifier} taken into custody`,
          createdAt: new Date(scannedAt.getTime() + 1000),
        },
      });
    }

    if (def.status === "OTP_SENT" || def.status === "DELIVERED") {
      await prisma.activity.create({
        data: {
          cardId: card.id,
          courierId: holderId,
          action: "OTP_SENT",
          message: `OTP sent by email to ${customers[def.customer].email[0]}*****@${customers[def.customer].email.split("@")[1]}`,
          createdAt: "otpHours" in def ? hoursAgo(def.otpHours) : now,
        },
      });
    }

    if (def.status === "OTP_SENT" && def.identifier === "CARD-1008") {
      await prisma.activity.create({
        data: {
          cardId: card.id,
          courierId: holderId,
          action: "OTP_FAILED",
          message: `OTP verification failed for ${def.identifier}`,
          createdAt: "otpHours" in def ? hoursAgo(def.otpHours - 0.2) : now,
        },
      });
    }

    if (def.status === "DELIVERED") {
      const deliveredAt = "deliveredHours" in def ? hoursAgo(def.deliveredHours) : now;
      await prisma.activity.create({
        data: {
          cardId: card.id,
          courierId: holderId,
          action: "OTP_VERIFIED",
          message: `OTP verified for ${def.identifier}`,
          createdAt: deliveredAt,
        },
      });
      await prisma.activity.create({
        data: {
          cardId: card.id,
          courierId: holderId,
          action: "DELIVERED",
          message: `Delivery completed for ${def.identifier}`,
          createdAt: new Date(deliveredAt.getTime() + 1000),
        },
      });
    }
  }

  const pending = cardDefs.filter((c) => c.status === "PENDING");
  console.log("Seed complete.");
  console.log("Courier login: courier@gmail.com / 12345678");
  console.log("Pending QR tokens (scan these):");
  for (const card of pending) {
    console.log(`  ${card.token}  (${card.identifier})`);
  }
  console.log(`QR images written to ${qrDir}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
