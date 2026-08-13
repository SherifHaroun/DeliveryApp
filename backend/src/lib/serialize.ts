import type { Activity, Card, Customer, Otp, User } from "@prisma/client";
import { prisma } from "./prisma.js";
import { HttpError } from "./http.js";
import { activityLabel } from "./activity.js";
import { maskEmail } from "./mask.js";
import { OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS } from "./otp.js";

export const CARD_STATUSES = {
  PENDING: "PENDING",
  IN_CUSTODY: "IN_CUSTODY",
  OTP_SENT: "OTP_SENT",
  DELIVERED: "DELIVERED",
} as const;

export type CardStatus = (typeof CARD_STATUSES)[keyof typeof CARD_STATUSES];

const cardInclude = { customer: true, courier: true } as const;

export type CardWithRelations = Card & { customer: Customer; courier?: User | null };

export type OtpSessionView = {
  expiresAt: string;
  sentAt: string;
  attemptsRemaining: number;
  resendAvailableAt: string;
  expired: boolean;
  locked: boolean;
  channel: "EMAIL" | "SMS";
  destination: string;
};

export function toOtpSession(otp: Otp, destinationEmail: string): OtpSessionView {
  const now = Date.now();
  const expired = otp.expiresAt.getTime() <= now;
  const locked = otp.attempts >= OTP_MAX_ATTEMPTS || Boolean(otp.invalidatedAt);
  const cooldownEnds = otp.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000;
  const resendAt = expired || locked ? now : Math.max(now, cooldownEnds);

  return {
    expiresAt: otp.expiresAt.toISOString(),
    sentAt: otp.createdAt.toISOString(),
    attemptsRemaining: Math.max(0, OTP_MAX_ATTEMPTS - otp.attempts),
    resendAvailableAt: new Date(resendAt).toISOString(),
    expired,
    locked,
    channel: otp.channel === "SMS" ? "SMS" : "EMAIL",
    destination: maskEmail(destinationEmail),
  };
}

export function serializeCard(
  card: CardWithRelations,
  otp?: Otp | null,
  lastActivity?: Activity | null,
) {
  return {
    id: card.id,
    identifier: card.identifier,
    qrToken: card.qrToken,
    last4: card.last4,
    cardType: card.cardType,
    status: card.status,
    scannedAt: card.scannedAt,
    assignedAt: card.scannedAt,
    otpSentAt: card.otpSentAt,
    deliveredAt: card.deliveredAt,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    customer: {
      id: card.customer.id,
      fullName: card.customer.fullName,
      email: maskEmail(card.customer.email),
      phone: card.customer.phone,
      address: card.customer.address,
      city: card.customer.city,
    },
    courier: card.courier
      ? {
          id: card.courier.id,
          fullName: card.courier.fullName,
          email: card.courier.email,
        }
      : null,
    lastAction: lastActivity
      ? {
          action: lastActivity.action,
          label: activityLabel(lastActivity.action),
          at: lastActivity.createdAt,
        }
      : null,
    otp:
      otp && !otp.verifiedAt && card.status === CARD_STATUSES.OTP_SENT
        ? toOtpSession(otp, card.customer.email)
        : null,
  };
}

export function normalizeQrValue(raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const param =
      url.searchParams.get("qr") ??
      url.searchParams.get("token") ??
      url.searchParams.get("code") ??
      url.searchParams.get("id");
    if (param?.trim()) {
      return param.trim().toUpperCase();
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length) {
      return decodeURIComponent(parts[parts.length - 1]).trim().toUpperCase();
    }
  } catch {
    // Plain QR payload, not a URL.
  }

  const upper = value.toUpperCase();
  const cibdel = upper.match(/CIBDEL-[A-Z0-9]+/);
  if (cibdel) return cibdel[0];
  return upper;
}

function qrLookupTokens(raw: string) {
  const tokens = new Set<string>();
  const trimmed = String(raw ?? "").trim();
  const normalized = normalizeQrValue(raw);
  if (trimmed) {
    tokens.add(trimmed);
    tokens.add(trimmed.toUpperCase());
  }
  if (normalized) tokens.add(normalized);
  return [...tokens];
}

export async function findCardByQr(qrToken: string) {
  const tokens = qrLookupTokens(qrToken);
  if (!tokens.length) {
    throw new HttpError(400, "QR code is required");
  }

  const card = await prisma.card.findFirst({
    where: {
      OR: tokens.flatMap((token) => [
        { qrToken: { equals: token, mode: "insensitive" } },
        { identifier: { equals: token, mode: "insensitive" } },
      ]),
    },
    include: cardInclude,
  });

  if (!card) {
    throw new HttpError(404, "This QR code is invalid or the card was not found.");
  }

  return card;
}

export function assertScanAccess(card: CardWithRelations, courierId: string) {
  if (card.status === CARD_STATUSES.DELIVERED) {
    throw new HttpError(400, "Card has already been delivered.");
  }

  if (card.courierId && card.courierId !== courierId) {
    throw new HttpError(409, "Card is currently assigned to another courier.");
  }
}
