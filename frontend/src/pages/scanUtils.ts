import type { DeliveryCard } from "../api/types";

export type ParsedScanResult = {
  card: { id: string; identifier: string; status: string } | null;
  alreadyInCustody: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readCard(value: unknown): ParsedScanResult["card"] {
  const record = asRecord(value);
  if (!record) return null;
  const id = typeof record.id === "string" ? record.id : "";
  if (!id) return null;
  const identifier =
    typeof record.identifier === "string" && record.identifier.trim()
      ? record.identifier.trim()
      : typeof record.qrToken === "string" && record.qrToken.trim()
        ? record.qrToken.trim()
        : id;
  const status = typeof record.status === "string" ? record.status : "IN_CUSTODY";
  return { id, identifier, status };
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
  if (!card) return null;
  return {
    id: card.id,
    identifier: card.identifier,
    qrToken: card.identifier,
    last4: "",
    cardType: "",
    status: card.status as DeliveryCard["status"],
    scannedAt: null,
    otpSentAt: null,
    deliveredAt: null,
    createdAt: "",
    updatedAt: "",
    customer: {
      id: "",
      fullName: "",
      email: "",
      phone: null,
      address: "",
      city: null,
    },
    courier: null,
  };
}
