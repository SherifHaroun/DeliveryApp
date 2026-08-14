function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function isProductionRuntime() {
  const nodeEnv = readEnv("NODE_ENV");
  if (nodeEnv === "development" || nodeEnv === "test") {
    return false;
  }
  return nodeEnv === "production" || Boolean(readEnv("RAILWAY_ENVIRONMENT"));
}

export function getJwtSecret() {
  const value = readEnv("JWT_SECRET");
  if (value) return value;
  if (isProductionRuntime()) {
    throw new Error("JWT_SECRET is required in production");
  }
  return "dev-secret";
}

export function getOtpPepper() {
  const value = readEnv("OTP_PEPPER");
  if (value) return value;
  if (isProductionRuntime()) {
    throw new Error("OTP_PEPPER is required in production");
  }
  return "dev-otp-pepper";
}

export function getResendApiKey() {
  return readEnv("RESEND_API_KEY");
}

export function getResendFrom() {
  return readEnv("RESEND_FROM") || "onboarding@resend.dev";
}

export function assertProductionSecrets() {
  if (!isProductionRuntime()) return;

  const missing = ["JWT_SECRET", "OTP_PEPPER"].filter((name) => !readEnv(name));
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}
