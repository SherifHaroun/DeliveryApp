import { randomInt } from "node:crypto";

export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
export const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60);
export const OTP_MAX_SENDS_PER_CARD_PER_HOUR = Number(process.env.OTP_MAX_SENDS_PER_CARD_PER_HOUR ?? 5);
export const OTP_MAX_SENDS_PER_COURIER_PER_HOUR = Number(process.env.OTP_MAX_SENDS_PER_COURIER_PER_HOUR ?? 20);

export function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export function otpExpiryDate(from = new Date()) {
  return new Date(from.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
}
