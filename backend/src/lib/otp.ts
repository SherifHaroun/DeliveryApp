import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { getOtpPepper } from "../config/env.js";

export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
export const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60);
export const OTP_MAX_SENDS_PER_CARD_PER_HOUR = Number(process.env.OTP_MAX_SENDS_PER_CARD_PER_HOUR ?? 5);
export const OTP_MAX_SENDS_PER_COURIER_PER_HOUR = Number(process.env.OTP_MAX_SENDS_PER_COURIER_PER_HOUR ?? 20);

const pepper = getOtpPepper();

export function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(code: string) {
  return createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

export function otpMatches(code: string, codeHash: string) {
  const hashed = hashOtp(code);
  const a = Buffer.from(hashed);
  const b = Buffer.from(codeHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function otpExpiryDate(from = new Date()) {
  return new Date(from.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
}
