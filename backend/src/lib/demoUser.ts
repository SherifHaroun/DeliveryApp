import bcrypt from "bcrypt";
import { prisma } from "./prisma.js";

export const DEMO_COURIER_EMAIL = "courier@gmail.com";
export const DEMO_COURIER_PASSWORD = "12345678";

export async function ensureDemoCourier() {
  const email = DEMO_COURIER_EMAIL;
  const passwordHash = await bcrypt.hash(DEMO_COURIER_PASSWORD, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: "Demo Courier",
        role: "COURIER",
      },
    });
    console.log("Demo courier account created.");
    return;
  }

  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      role: "COURIER",
    },
  });
}
