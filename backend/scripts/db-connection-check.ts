import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("CONNECT_OK");

  const email = `db-check-${Date.now()}@delivery.local`;
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash: "db-connection-check",
      fullName: "DB Connection Check",
      role: "COURIER",
    },
  });
  console.log(`WRITE_OK ${created.id}`);

  const read = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
  if (read.email !== email) {
    throw new Error("Read did not match written row");
  }
  console.log(`READ_OK ${read.email}`);

  await prisma.user.delete({ where: { id: created.id } });
  console.log("CLEANUP_OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
