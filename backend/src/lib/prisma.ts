import { PrismaClient } from "@prisma/client";
import { isMemoryDataMode } from "../config/dataMode.js";
import { createMemoryPrisma } from "./memoryStore.js";

export const prisma = (
  isMemoryDataMode() ? createMemoryPrisma() : new PrismaClient()
) as PrismaClient;
