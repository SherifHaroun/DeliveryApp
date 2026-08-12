import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { activitySummary } from "../lib/activity.js";
import { CARD_STATUSES } from "../lib/serialize.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const courierId = req.user!.id;

    const [pending, delivered, inCustody, otpSent, recent] = await Promise.all([
      prisma.card.count({ where: { status: CARD_STATUSES.PENDING } }),
      prisma.card.count({ where: { courierId, status: CARD_STATUSES.DELIVERED } }),
      prisma.card.count({ where: { courierId, status: CARD_STATUSES.IN_CUSTODY } }),
      prisma.card.count({ where: { courierId, status: CARD_STATUSES.OTP_SENT } }),
      prisma.activity.findMany({
        where: { courierId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 10,
        include: {
          card: { include: { customer: true } },
        },
      }),
    ]);

    const myUndelivered = inCustody + otpSent;

    res.json({
      toBeDelivered: pending + myUndelivered,
      delivered,
      inCustody: myUndelivered,
      recentActivity: recent.map((item) => ({
        id: item.id,
        action: item.action,
        summary: activitySummary(item.action),
        message: item.message,
        createdAt: item.createdAt,
        identifier: item.card.identifier,
        last4: item.card.last4,
        customerName: item.card.customer.fullName,
        status: item.card.status,
      })),
    });
  }),
);
