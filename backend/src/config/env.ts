function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function isDemoMode() {
  const value = readEnv("DEMO_MODE").toLowerCase();
  return value === "true" || value === "1" || value === "on" || value === "yes";
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
  if (isDemoMode()) {
    return "dev-otp-pepper";
  }
  if (isProductionRuntime()) {
    throw new Error("OTP_PEPPER is required when DEMO_MODE=false");
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

  const missing = ["JWT_SECRET"].filter((name) => !readEnv(name));
  if (!isDemoMode() && !readEnv("OTP_PEPPER")) {
    missing.push("OTP_PEPPER");
  }
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}
