import "dotenv/config";
import { createApp } from "./app.js";
import { ensureDemoLabelCards } from "./lib/demoCards.js";
import { ensureDemoCourier } from "./lib/demoUser.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT ?? 4100);
const app = createApp();

async function main() {
  await ensureDemoCourier();
  await ensureDemoLabelCards();

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Delivery API listening on port ${port}`);
  });

  async function shutdown() {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
