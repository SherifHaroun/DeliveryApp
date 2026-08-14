import type { DeliveryCard } from "../api/types";

export type ParsedScanResult = {
  card: DeliveryCard | null;
  alreadyInCustody: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] : "";
}

function readCustomer(value: unknown): DeliveryCard["customer"] {
  const record = asRecord(value);
  if (!record) {
    return { id: "", fullName: "", email: "", phone: null, address: "", city: null };
  }
  return {
    id: readString(record, "id"),
    fullName: readString(record, "fullName"),
    email: readString(record, "email"),
    phone: typeof record.phone === "string" ? record.phone : null,
    address: readString(record, "address"),
    city: typeof record.city === "string" ? record.city : null,
  };
}

function readCourier(value: unknown): DeliveryCard["courier"] {
  const record = asRecord(value);
  if (!record) return null;
  const id = readString(record, "id");
  if (!id) return null;
  return {
    id,
    fullName: readString(record, "fullName"),
    email: readString(record, "email"),
  };
}

function readCard(value: unknown): DeliveryCard | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = readString(record, "id");
  if (!id) return null;
  const identifier = readString(record, "identifier").trim() || id;
  const status = readString(record, "status") || "IN_CUSTODY";

  return {
    id,
    identifier,
    last4: readString(record, "last4"),
    cardType: readString(record, "cardType"),
    status: status as DeliveryCard["status"],
    scannedAt: typeof record.scannedAt === "string" ? record.scannedAt : null,
    otpSentAt: typeof record.otpSentAt === "string" ? record.otpSentAt : null,
    deliveredAt: typeof record.deliveredAt === "string" ? record.deliveredAt : null,
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
    customer: readCustomer(record.customer),
    courier: readCourier(record.courier),
  };
}

export function parseScanResponse(payload: unknown): ParsedScanResult {
  const record = asRecord(payload);
  if (!record) return { card: null, alreadyInCustody: false };

  const nested = readCard(record.card);
  if (nested) {
    return { card: nested, alreadyInCustody: Boolean(record.alreadyInCustody) };
  }

  const direct = readCard(record);
  return { card: direct, alreadyInCustody: Boolean(record.alreadyInCustody) };
}

export function mapScanError(error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : NaN;
  const message = error instanceof Error ? error.message : "";

  if (status === 0 || /unable to connect|network|failed to fetch/i.test(message)) {
    return {
      title: "Unable to connect",
      text: "Unable to connect to the server. Please try again.",
    };
  }
  const lower = message.toLowerCase();
  if (status === 404 || lower.includes("not found") || lower.includes("invalid")) {
    return {
      title: "Unable to read this card",
      text: "We couldn't find this card.",
    };
  }
  if (lower.includes("already been delivered")) {
    return {
      title: "Already delivered",
      text: "This card has already been delivered.",
    };
  }
  if (lower.includes("another courier")) {
    return {
      title: "Unable to read this card",
      text: "This card is assigned to another courier.",
    };
  }
  if (message) {
    return {
      title: "Unable to read this card",
      text: message,
    };
  }

  return {
    title: "Something went wrong",
    text: "Something went wrong. Please try again.",
  };
}

export function toDisplayCard(card: ParsedScanResult["card"]): DeliveryCard | null {
  return card;
}
