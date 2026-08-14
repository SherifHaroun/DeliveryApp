import { prisma } from "./prisma.js";

/** Demo label identifiers used to seed test cards. Scanner logic does not whitelist these. */
const DEMO_LABELS = Array.from({ length: 10 }, (_, index) => {
  const number = String(index + 1).padStart(5, "0");
  return `C${number}`;
});

/** Resend test mode can only deliver to this account email. */
const OTP_RECIPIENT_EMAIL = "sherief.mharoun@gmail.com";

export const DEMO_CUSTOMERS = [
  { fullName: "Nour El-Sayed", phone: "+20 122 441 8801", address: "14 Nile Corniche, Maadi", city: "Cairo" },
  { fullName: "Omar Farouk", phone: "+20 100 332 4410", address: "88 Tahrir Street, Dokki", city: "Giza" },
  { fullName: "Salma Adel", phone: "+20 111 220 3390", address: "5 Mohamed Mazhar, Zamalek", city: "Cairo" },
  { fullName: "Youssef Kamal", phone: "+20 128 774 2211", address: "32 Fouad Street", city: "Alexandria" },
  { fullName: "Laila Mostafa", phone: "+20 106 998 3344", address: "9 Abbas El Akkad, Nasr City", city: "Cairo" },
  { fullName: "Hassan Ibrahim", phone: "+20 155 667 8890", address: "21 El Geish Road", city: "Mansoura" },
  { fullName: "Mona Sherif", phone: "+20 120 445 7788", address: "4 El Horreya Avenue", city: "Alexandria" },
  { fullName: "Ahmed Nabil", phone: "+20 101 223 5566", address: "17 Rehab City, Group 75", city: "Cairo" },
  { fullName: "Dina Magdy", phone: "+20 114 889 0012", address: "6 October, El Motamayez", city: "Giza" },
  { fullName: "Tarek Fathy", phone: "+20 127 334 6677", address: "11 Port Said Street", city: "Suez" },
] as const;

async function demoCustomers() {
  const customers = [];

  for (const [index, person] of DEMO_CUSTOMERS.entries()) {
    const identifier = DEMO_LABELS[index];
    const card = await prisma.card.findUnique({ where: { identifier } });

    let customer =
      (await prisma.customer.findFirst({ where: { fullName: person.fullName } })) ??
      (card ? await prisma.customer.findUnique({ where: { id: card.customerId } }) : null) ??
      (await prisma.customer.findFirst({ where: { fullName: `Cardholder ${identifier}` } }));

    const data = {
      fullName: person.fullName,
      email: OTP_RECIPIENT_EMAIL,
      phone: person.phone,
      address: person.address,
      city: person.city,
    };

    if (!customer) {
      customer = await prisma.customer.create({ data });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data,
      });
    }

    customers.push(customer);
  }

  await prisma.customer.updateMany({
    data: { email: OTP_RECIPIENT_EMAIL },
  });

  return customers;
}

export async function ensureDemoLabelCards() {
  const customers = await demoCustomers();

  for (const [index, identifier] of DEMO_LABELS.entries()) {
    const customer = customers[index];
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

    const data: { customerId: string; qrToken?: string } = { customerId: customer.id };
    if (existing.qrToken !== identifier) {
      const tokenTaken = await prisma.card.findFirst({
        where: { qrToken: identifier, NOT: { id: existing.id } },
      });
      if (!tokenTaken) {
        data.qrToken = identifier;
      }
    }

    await prisma.card.update({
      where: { id: existing.id },
      data,
    });
  }
}
