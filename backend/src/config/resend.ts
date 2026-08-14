import { getResendApiKey, getResendFrom } from "./env.js";

const RESEND_API_KEY = getResendApiKey();
const RESEND_FROM = getResendFrom();

export { RESEND_API_KEY, RESEND_FROM };

export function isResendConfigured() {
  return RESEND_API_KEY.length > 0;
}
