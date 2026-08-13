import { prisma } from "./prisma.js";

/** Demo label identifiers used to seed test cards. Scanner logic does not whitelist these. */
const DEMO_LABELS = Array.from({ length: 10 }, (_, index) => {
  const number = String(index + 1).padStart(5, "0");
  return `C${number}`;
});

async function demoCustomers() {
  const existing = await prisma.customer.findMany({ orderBy: { createdAt: "asc" } });
  if (existing.length >= DEMO_LABELS.length) {
    return existing;
  }

  const created = [...existing];
  for (let i = existing.length; i < DEMO_LABELS.length; i += 1) {
    const label = DEMO_LABELS[i];
    created.push(
      await prisma.customer.create({
        data: {
          fullName: `Cardholder ${label}`,
          email: `${label.toLowerCase()}@example.com`,
          phone: null,
          address: "On file",
          city: null,
        },
      }),
    );
  }
  return created;
}

export async function ensureDemoLabelCards() {
  const customers = await demoCustomers();

  for (const [index, identifier] of DEMO_LABELS.entries()) {
    const customer = customers[index % customers.length];
    const last4 = identifier.slice(-4);
    const existing = await prisma.card.findUnique({ where: { identifier } });

    if (!existing) {
      const tokenTaken = await prisma.card.findUnique({ where: { qrToken: identifier } });
      await prisma.card.create({
        data: {
          identifier,
          qrToken: tokenTaken ? `${identifier}-QR` : identifier,
          last4,
          cardType: "Debit",
          status: "PENDING",
          customerId: customer.id,
        },
      });
      continue;
    }

    if (existing.qrToken !== identifier) {
      const tokenTaken = await prisma.card.findFirst({
        where: { qrToken: identifier, NOT: { id: existing.id } },
      });
      if (!tokenTaken) {
        await prisma.card.update({
          where: { id: existing.id },
          data: { qrToken: identifier },
        });
      }
    }
  }
}
