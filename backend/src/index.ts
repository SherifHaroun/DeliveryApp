import "./config/loadEnv.js";
import { createApp } from "./app.js";
import { assertDataMode, isMemoryDataMode } from "./config/dataMode.js";
import { assertProductionSecrets } from "./config/env.js";
import { ensureDemoLabelCards } from "./lib/demoCards.js";
import { ensureDemoCourier } from "./lib/demoUser.js";
import { logMemoryDevHints } from "./lib/memoryStore.js";
import { prisma } from "./lib/prisma.js";

assertDataMode();
assertProductionSecrets();

const port = Number(process.env.PORT ?? 4100);
const app = createApp();

async function main() {
  if (isMemoryDataMode()) {
    logMemoryDevHints();
  } else {
    await ensureDemoCourier();
    await ensureDemoLabelCards();
  }

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
