import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { activitySummary } from "../lib/activity.js";
import { CARD_STATUSES } from "../lib/serialize.js";

export const dashboardRouter = Router();

function uniqueLatestCardActivity<
  T extends { id: string; identifier: string; activities: { createdAt: Date; id: string }[] },
>(cards: T[]) {
  const seen = new Set<string>();
  return cards
    .filter((card) => card.activities[0])
    .sort((a, b) => {
      const aTime = a.activities[0]!.createdAt.getTime();
      const bTime = b.activities[0]!.createdAt.getTime();
      if (bTime !== aTime) return bTime - aTime;
      return b.activities[0]!.id.localeCompare(a.activities[0]!.id);
    })
    .filter((card) => {
      if (seen.has(card.id) || seen.has(card.identifier)) return false;
      seen.add(card.id);
      seen.add(card.identifier);
      return true;
    });
}

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const courierId = req.user!.id;

    const [delivered, inCustody, otpSent, cards] = await Promise.all([
      prisma.card.count({ where: { courierId, status: CARD_STATUSES.DELIVERED } }),
      prisma.card.count({ where: { courierId, status: CARD_STATUSES.IN_CUSTODY } }),
      prisma.card.count({ where: { courierId, status: CARD_STATUSES.OTP_SENT } }),
      prisma.card.findMany({
        where: { courierId, activities: { some: { courierId } } },
        include: {
          customer: true,
          activities: {
            where: { courierId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
      }),
    ]);

    const myOpenCards = inCustody + otpSent;
    const recentActivity = uniqueLatestCardActivity(cards).slice(0, 10);

    res.json({
      toBeDelivered: myOpenCards,
      delivered,
      inCustody: myOpenCards,
      recentActivity: recentActivity.map((card) => {
        const item = card.activities[0]!;
        return {
          id: item.id,
          cardId: card.id,
          action: item.action,
          summary: activitySummary(item.action),
          message: item.message,
          createdAt: item.createdAt,
          identifier: card.identifier,
          last4: card.last4,
          customerName: card.customer.fullName,
          status: card.status,
        };
      }),
    });
  }),
);
