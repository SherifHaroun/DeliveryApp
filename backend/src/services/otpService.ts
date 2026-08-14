import type { Otp } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http.js";
import { maskEmail } from "../lib/mask.js";
import {
  generateOtpCode,
  otpExpiryDate,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS_PER_CARD_PER_HOUR,
  OTP_MAX_SENDS_PER_COURIER_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../lib/otp.js";
import { ACTIVITY } from "../lib/activity.js";
import { CARD_STATUSES, serializeCard } from "../lib/serialize.js";
import { isDemoMode } from "../config/env.js";
import { sendOtpNotification } from "./notification/index.js";

const cardInclude = { customer: true, courier: true } as const;

async function getOwnedCard(cardId: string, courierId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, courierId },
    include: cardInclude,
  });

  if (!card) {
    throw new HttpError(404, "Delivery not found.");
  }

  return card;
}

export async function getActiveOtp(cardId: string) {
  return prisma.otp.findFirst({
    where: { cardId, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeliveryForCourier(cardId: string, courierId: string) {
  const card = await getOwnedCard(cardId, courierId);
  const otp = card.status === CARD_STATUSES.OTP_SENT ? await getActiveOtp(card.id) : null;
  return serializeCard(card, otp);
}

function assertCanSendOtp(status: string) {
  if (status === CARD_STATUSES.PENDING) {
    throw new HttpError(400, "Card must be in custody before sending an OTP.");
  }
  if (status === CARD_STATUSES.DELIVERED) {
    throw new HttpError(400, "Card has already been delivered.");
  }
  if (status !== CARD_STATUSES.IN_CUSTODY && status !== CARD_STATUSES.OTP_SENT) {
    throw new HttpError(400, "Card must be in custody before sending an OTP.");
  }
}

export async function sendOtp(cardId: string, courierId: string) {
  const card = await getOwnedCard(cardId, courierId);
  assertCanSendOtp(card.status);

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [cardSends, courierSends, latest] = await Promise.all([
    prisma.otp.count({ where: { cardId: card.id, createdAt: { gte: hourAgo } } }),
    prisma.otp.count({ where: { courierId, createdAt: { gte: hourAgo } } }),
    getActiveOtp(card.id),
  ]);

  if (cardSends >= OTP_MAX_SENDS_PER_CARD_PER_HOUR) {
    throw new HttpError(429, "Too many OTP requests for this card. Try again later.");
  }
  if (courierSends >= OTP_MAX_SENDS_PER_COURIER_PER_HOUR) {
    throw new HttpError(429, "Too many OTP requests. Try again later.");
  }

  if (latest && !latest.verifiedAt) {
    const expired = latest.expiresAt.getTime() <= Date.now();
    const locked = latest.attempts >= OTP_MAX_ATTEMPTS;
    const inCooldown = Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (!expired && !locked && inCooldown) {
      throw new HttpError(429, "Please wait before sending another OTP.", {
        resendAvailableAt: new Date(latest.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
      });
    }
  }

  const previousStatus = card.status;
  const previousOtpSentAt = card.otpSentAt;
  const previousOtpId = latest && !latest.verifiedAt ? latest.id : null;

  const code = generateOtpCode();
  const expiresAt = otpExpiryDate();
  const sentAt = new Date();

  const created = await prisma.$transaction(async (tx) => {
    await tx.otp.updateMany({
      where: { cardId: card.id, invalidatedAt: null, verifiedAt: null },
      data: { invalidatedAt: sentAt },
    });

    const otp = await tx.otp.create({
      data: {
        cardId: card.id,
        courierId,
        codeHash: code,
        channel: "EMAIL",
        expiresAt,
      },
    });

    const updated = await tx.card.update({
      where: { id: card.id },
      data: { status: CARD_STATUSES.OTP_SENT, otpSentAt: sentAt },
      include: cardInclude,
    });

    return { otp, card: updated };
  });

  if (!isDemoMode()) {
    try {
      await sendOtpNotification({
        channel: "EMAIL",
        to: card.customer.email,
        customerName: card.customer.fullName,
        code,
        cardIdentifier: card.identifier,
        last4: card.last4,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      });
    } catch {
      await prisma.$transaction(async (tx) => {
        await tx.otp.update({
          where: { id: created.otp.id },
          data: { invalidatedAt: new Date() },
        });

        if (previousOtpId) {
          await tx.otp.update({
            where: { id: previousOtpId },
            data: { invalidatedAt: null },
          });
        }

        await tx.card.update({
          where: { id: card.id },
          data: {
            status: previousStatus,
            otpSentAt: previousOtpSentAt,
          },
        });
      });
      console.error("Failed to send OTP email.");
      throw new HttpError(502, "Something went wrong while sending the OTP.");
    }
  }

  await prisma.activity.create({
    data: {
      cardId: card.id,
      courierId,
      action: ACTIVITY.OTP_SENT,
      message: `OTP sent by email to ${maskEmail(card.customer.email)}`,
    },
  });

  return {
    card: serializeCard(created.card, created.otp),
    demoOtp: isDemoMode() ? code : undefined,
  };
}

export async function verifyOtp(cardId: string, courierId: string, rawCode: string) {
  const code = String(rawCode ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw new HttpError(400, "Enter the 6-digit OTP.");
  }

  const card = await getOwnedCard(cardId, courierId);

  if (card.status === CARD_STATUSES.DELIVERED) {
    throw new HttpError(400, "Card has already been delivered.");
  }
  if (card.status !== CARD_STATUSES.OTP_SENT) {
    throw new HttpError(400, "Send an OTP to the customer first.");
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const otp = await tx.otp.findFirst({
      where: { cardId: card.id, invalidatedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return { type: "missing" as const };
    }

    if (otp.verifiedAt) {
      return { type: "used" as const };
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      if (!otp.invalidatedAt) {
        await tx.otp.update({
          where: { id: otp.id },
          data: { invalidatedAt: new Date() },
        });
      }
      return { type: "locked" as const };
    }

    if (otp.expiresAt.getTime() <= Date.now()) {
      return { type: "expired" as const };
    }

    if (otp.codeHash !== code) {
      const attempts = otp.attempts + 1;
      const locked = attempts >= OTP_MAX_ATTEMPTS;
      await tx.otp.update({
        where: { id: otp.id },
        data: {
          attempts,
          invalidatedAt: locked ? new Date() : otp.invalidatedAt,
        },
      });
      await tx.activity.create({
        data: {
          cardId: card.id,
          courierId,
          action: ACTIVITY.OTP_FAILED,
          message: `OTP verification failed for ${card.identifier}`,
        },
      });
      return { type: "wrong" as const, attempts };
    }

    const used = await tx.otp.updateMany({
      where: { id: otp.id, verifiedAt: null, invalidatedAt: null },
      data: { verifiedAt: new Date() },
    });

    if (used.count === 0) {
      return { type: "used" as const };
    }

    const deliveredAt = new Date();
    const delivered = await tx.card.updateMany({
      where: {
        id: card.id,
        courierId,
        status: CARD_STATUSES.OTP_SENT,
      },
      data: {
        status: CARD_STATUSES.DELIVERED,
        deliveredAt,
      },
    });

    if (delivered.count === 0) {
      throw new HttpError(409, "Delivery could not be completed. Refresh and try again.");
    }

    await tx.activity.create({
      data: {
        cardId: card.id,
        courierId,
        action: ACTIVITY.OTP_VERIFIED,
        message: `OTP verified for ${card.identifier}`,
      },
    });

    await tx.activity.create({
      data: {
        cardId: card.id,
        courierId,
        action: ACTIVITY.DELIVERED,
        message: `Delivery completed for ${card.identifier}`,
      },
    });

    const updated = await tx.card.findUniqueOrThrow({
      where: { id: card.id },
      include: cardInclude,
    });

    return { type: "ok" as const, card: updated };
  });

  if (outcome.type === "missing") {
    throw new HttpError(400, "No active OTP found. Send a new OTP.");
  }
  if (outcome.type === "used") {
    throw new HttpError(400, "This OTP has already been used.");
  }
  if (outcome.type === "locked") {
    throw new HttpError(400, "Too many incorrect attempts. Send a new OTP.");
  }
  if (outcome.type === "expired") {
    throw new HttpError(400, "This OTP has expired. Send a new OTP.");
  }
  if (outcome.type === "wrong") {
    throw new HttpError(400, "Incorrect OTP.", {
      attemptsRemaining: Math.max(0, OTP_MAX_ATTEMPTS - outcome.attempts),
    });
  }

  return serializeCard(outcome.card);
}

export type { Otp };
