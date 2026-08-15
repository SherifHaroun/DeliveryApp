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

export function getResendApiKey() {
  return readEnv("RESEND_API_KEY").replace(/^["']|["']$/g, "");
}

const PUBLIC_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

function emailDomain(value: string) {
  const match = value.match(/<([^>]+)>/) ?? [null, value];
  const address = String(match[1] ?? "").trim().toLowerCase();
  return address.split("@")[1] ?? "";
}

export function getResendFromEmail() {
  const value = readEnv("RESEND_FROM_EMAIL").replace(/^["']|["']$/g, "");
  const domain = emailDomain(value);
  if (!value || PUBLIC_MAIL_DOMAINS.has(domain)) {
    return "Card Delivery Team <onboarding@resend.dev>";
  }
  return value;
}

export function assertProductionSecrets() {
  if (!isProductionRuntime()) return;

  const missing = ["JWT_SECRET"].filter((name) => !readEnv(name));
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}
