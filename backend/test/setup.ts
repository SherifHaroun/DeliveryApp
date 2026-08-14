import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { afterAll, vi } from "vitest";

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.OTP_PEPPER ??= "test-otp-pepper";
process.env.OTP_RESEND_COOLDOWN_SECONDS ??= "0";
delete process.env.RESEND_API_KEY;
delete process.env.BACKEND_DATA_MODE;

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim() ?? "";
if (!testDatabaseUrl) {
  throw new Error(
    "Backend tests require TEST_DATABASE_URL pointing at an isolated PostgreSQL database named with 'test' (for example delivery_test). DATABASE_URL is ignored so tests cannot use the application database.",
  );
}

if (isUnsafeTestDatabaseUrl(testDatabaseUrl)) {
  throw new Error(
    "Refusing to run tests against this TEST_DATABASE_URL. Use a local or CI Postgres database whose name contains 'test' (for example delivery_test). Do not use production hosts.",
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
const databaseUrl = testDatabaseUrl;

execSync("npx prisma migrate deploy", {
  cwd: backendRoot,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

vi.mock("../src/services/notification/index.js", () => ({
  sendOtpNotification: vi.fn().mockResolvedValue({ channel: "EMAIL", sent: true }),
}));

afterAll(async () => {
  const { prisma } = await import("../src/lib/prisma.js");
  await prisma.$disconnect();
});

function isUnsafeTestDatabaseUrl(url: string) {
  if (/railway\.app|render\.com|amazonaws\.com|neon\.tech|supabase\.co|vercel-storage|prisma\.io/i.test(url)) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, "").split("?")[0] ?? "");
    return !/test/i.test(dbName);
  } catch {
    return true;
  }
}
