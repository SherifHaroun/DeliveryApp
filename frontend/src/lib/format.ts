export function formatWhen(value: string | null) {
  if (!value) return "—";
  return `${formatDate(value)} ${formatTime(value)}`;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function activityLabel(action: string) {
  switch (action) {
    case "QR_SCANNED":
      return "QR Scanned";
    case "TAKEN_INTO_CUSTODY":
    case "SCANNED":
      return "Card Taken Into Custody";
    case "OTP_SENT":
      return "OTP Sent";
    case "OTP_FAILED":
      return "OTP Verification Failed";
    case "OTP_VERIFIED":
      return "OTP Verified";
    case "DELIVERED":
      return "Delivery Completed";
    default:
      return action;
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending Delivery";
    case "IN_CUSTODY":
      return "In Custody";
    case "OTP_SENT":
      return "OTP Sent";
    case "DELIVERED":
      return "Delivered";
    default:
      return status;
  }
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "*****";
  if (local.includes("*")) return email;
  return `${local[0]}*****@${domain}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
