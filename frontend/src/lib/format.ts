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
      return "Pending";
    case "IN_CUSTODY":
      return "Ready for Delivery";
    case "OTP_SENT":
      return "OTP Sent";
    case "DELIVERED":
      return "Delivered";
    default:
      return status;
  }
}

export function groupByDay<T>(items: T[], getDate: (item: T) => string) {
  const groups: { heading: string; items: T[] }[] = [];
  for (const item of items) {
    const heading = dayHeading(getDate(item));
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) {
      last.items.push(item);
    } else {
      groups.push({ heading, items: [item] });
    }
  }
  return groups;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "*****";
  if (local.includes("*")) return email;
  return `${local[0]}*****@${domain}`;
}

export function maskedCard(last4: string) {
  return `Card •••• ${last4}`;
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function dayHeading(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatDate(value);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
