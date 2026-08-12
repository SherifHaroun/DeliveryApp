import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http.js";
import { ACTIVITY } from "../lib/activity.js";
import {
  CARD_STATUSES,
  assertScanAccess,
  findCardByQr,
  serializeCard,
  type CardWithRelations,
} from "../lib/serialize.js";

function isOwnActiveCard(card: CardWithRelations, courierId: string) {
  return (
    card.courierId === courierId &&
    (card.status === CARD_STATUSES.IN_CUSTODY || card.status === CARD_STATUSES.OTP_SENT)
  );
}

export async function lookupCard(qrToken: string, courierId: string) {
  const card = await findCardByQr(qrToken);
  assertScanAccess(card, courierId);

  return {
    card: serializeCard(card),
    alreadyInCustody: isOwnActiveCard(card, courierId),
  };
}

export async function takeCustody(qrToken: string, courierId: string) {
  const card = await findCardByQr(qrToken);
  assertScanAccess(card, courierId);

  if (isOwnActiveCard(card, courierId)) {
    return {
      card: serializeCard(card),
      alreadyInCustody: true,
    };
  }

  if (card.status !== CARD_STATUSES.PENDING) {
    throw new HttpError(400, "Card is not available for delivery.");
  }

  const scannedAt = new Date();

  const assigned = await prisma.$transaction(async (tx) => {
    const result = await tx.card.updateMany({
      where: {
        id: card.id,
        status: CARD_STATUSES.PENDING,
        courierId: null,
      },
      data: {
        status: CARD_STATUSES.IN_CUSTODY,
        courierId,
        scannedAt,
      },
    });

    if (result.count === 0) {
      const latest = await tx.card.findUnique({
        where: { id: card.id },
        include: { customer: true, courier: true },
      });

      if (!latest) {
        throw new HttpError(404, "Card not found.");
      }

      assertScanAccess(latest, courierId);

      if (isOwnActiveCard(latest, courierId)) {
        return { card: latest, alreadyInCustody: true as const };
      }

      throw new HttpError(409, "Card is currently assigned to another courier.");
    }

    await tx.activity.create({
      data: {
        cardId: card.id,
        courierId,
        action: ACTIVITY.QR_SCANNED,
        message: `QR scanned for ${card.identifier}`,
        createdAt: scannedAt,
      },
    });

    await tx.activity.create({
      data: {
        cardId: card.id,
        courierId,
        action: ACTIVITY.TAKEN_INTO_CUSTODY,
        message: `Card ${card.identifier} taken into custody`,
        createdAt: new Date(scannedAt.getTime() + 1000),
      },
    });

    const updated = await tx.card.findUniqueOrThrow({
      where: { id: card.id },
      include: { customer: true, courier: true },
    });

    return { card: updated, alreadyInCustody: false as const };
  });

  return {
    card: serializeCard(assigned.card),
    alreadyInCustody: assigned.alreadyInCustody,
  };
}
