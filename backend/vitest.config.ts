import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30000,
    hookTimeout: 60000,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret",
      OTP_PEPPER: "test-otp-pepper",
      OTP_RESEND_COOLDOWN_SECONDS: "0",
      OTP_MAX_ATTEMPTS: "5",
      OTP_MAX_SENDS_PER_CARD_PER_HOUR: "20",
      OTP_MAX_SENDS_PER_COURIER_PER_HOUR: "50",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/types/**"],
    },
  },
});
