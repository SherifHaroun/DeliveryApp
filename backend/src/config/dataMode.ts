import { isProductionRuntime } from "./env.js";

export function isMemoryDataMode() {
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  return (process.env.BACKEND_DATA_MODE ?? "").trim().toLowerCase() === "memory";
}

export function assertDataMode() {
  if (isMemoryDataMode() && isProductionRuntime()) {
    throw new Error("BACKEND_DATA_MODE=memory is not allowed in production");
  }
}
