export const ACTIVITY = {
  QR_SCANNED: "QR_SCANNED",
  TAKEN_INTO_CUSTODY: "TAKEN_INTO_CUSTODY",
  OTP_SENT: "OTP_SENT",
  OTP_FAILED: "OTP_FAILED",
  OTP_VERIFIED: "OTP_VERIFIED",
  DELIVERED: "DELIVERED",
} as const;

export function activityLabel(action: string) {
  switch (action) {
    case ACTIVITY.QR_SCANNED:
      return "QR Scanned";
    case ACTIVITY.TAKEN_INTO_CUSTODY:
    case "SCANNED":
      return "Card Taken Into Custody";
    case ACTIVITY.OTP_SENT:
      return "OTP Sent";
    case ACTIVITY.OTP_FAILED:
      return "OTP Verification Failed";
    case ACTIVITY.OTP_VERIFIED:
      return "OTP Verified";
    case ACTIVITY.DELIVERED:
      return "Delivery Completed";
    default:
      return action;
  }
}

export function activitySummary(action: string) {
  switch (action) {
    case ACTIVITY.QR_SCANNED:
      return "Card scanned";
    case ACTIVITY.TAKEN_INTO_CUSTODY:
    case "SCANNED":
      return "Card taken into custody";
    case ACTIVITY.OTP_SENT:
      return "OTP sent";
    case ACTIVITY.OTP_FAILED:
      return "OTP verification failed";
    case ACTIVITY.OTP_VERIFIED:
      return "OTP verified";
    case ACTIVITY.DELIVERED:
      return "Card delivered";
    default:
      return activityLabel(action);
  }
}
