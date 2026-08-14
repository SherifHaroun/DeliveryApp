import { getResendApiKey, getResendFromEmail } from "./env.js";

const RESEND_API_KEY = getResendApiKey();
const RESEND_FROM_EMAIL = getResendFromEmail();

export { RESEND_API_KEY, RESEND_FROM_EMAIL };

export function isResendConfigured() {
  return RESEND_API_KEY.length > 0;
}
