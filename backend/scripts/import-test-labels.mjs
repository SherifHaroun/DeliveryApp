import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
const prisma = new PrismaClient();
const label = number => `C${String(number).padStart(5, "0")}`;

try {
  const result = await prisma.$transaction(async tx => {
    const created = [];
    const preserved = [];
    for (let number = 11; number <= 30; number++) {
      const identifier = label(number);
      const existing = await tx.card.findUnique({ where: { identifier }, select: { id: true } });
      if (existing) { preserved.push(identifier); continue; }
      const conflict = await tx.card.findUnique({ where: { qrToken: identifier }, select: { id: true } });
      if (conflict) throw new Error(`QR payload ${identifier} already belongs to a different card. No cards were imported.`);
      const source = await tx.card.findUnique({
        where: { identifier: label(((number - 1) % 10) + 1) },
        select: { customerId: true, cardType: true },
      });
      if (!source) throw new Error(`The original test card ${label(((number - 1) % 10) + 1)} is missing. No cards were imported.`);
      await tx.card.create({ data: {
        identifier, qrToken: identifier, last4: identifier.slice(-4),
        cardType: source.cardType, customerId: source.customerId, status: "PENDING",
      }, select: { id: true } });
      created.push(identifier);
    }
    return { created, preserved };
  }, { timeout: 60000 });
  const cards = await prisma.card.findMany({
    where: { identifier: { in: Array.from({ length: 20 }, (_, index) => label(index + 11)) } },
    select: { identifier: true, qrToken: true, status: true }, orderBy: { identifier: "asc" },
  });
  console.log(JSON.stringify({ ...result, verifiedCards: cards }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Import failed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
