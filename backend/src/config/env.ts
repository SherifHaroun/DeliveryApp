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
  if (isDemoMode()) {
    return "dev-secret";
  }
  if (isProductionRuntime()) {
    throw new Error("JWT_SECRET is required in production");
  }
  return "dev-secret";
}

export function getResendApiKey() {
  return readEnv("RESEND_API_KEY");
}

export function getResendFrom() {
  return readEnv("RESEND_FROM") || "onboarding@resend.dev";
}

export function assertProductionSecrets() {
  if (!isProductionRuntime() || isDemoMode()) return;

  const missing = ["JWT_SECRET"].filter((name) => !readEnv(name));
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}
