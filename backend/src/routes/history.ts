import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError, asyncHandler } from "../lib/http.js";
import { activityLabel } from "../lib/activity.js";
import { CARD_STATUSES } from "../lib/serialize.js";

export const historyRouter = Router();

historyRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const courierId = req.user!.id;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const where: Prisma.ActivityWhereInput = { courierId };

    if (q) {
      where.OR = [
        { action: { contains: q } },
        { message: { contains: q } },
        { card: { identifier: { contains: q } } },
        { card: { customer: { fullName: { contains: q } } } },
      ];
    }

    const rows = await prisma.activity.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        card: { include: { customer: true } },
        courier: true,
      },
    });

    res.json(
      rows.map((row) => ({
        id: row.id,
        action: row.action,
        actionLabel: activityLabel(row.action),
        message: row.message,
        createdAt: row.createdAt,
        cardId: row.card.id,
        cardIdentifier: row.card.identifier,
        customerName: row.card.customer.fullName,
        courierName: row.courier.fullName,
        status: row.card.status,
        statusLabel:
          row.card.status === CARD_STATUSES.PENDING
            ? "Pending Delivery"
            : row.card.status === CARD_STATUSES.IN_CUSTODY
              ? "In Custody"
              : row.card.status === CARD_STATUSES.OTP_SENT
                ? "OTP Sent"
                : "Delivered",
      })),
    );
  }),
);

historyRouter.post(
  "/",
  asyncHandler(async () => {
    throw new HttpError(403, "Delivery history cannot be edited.");
  }),
);

historyRouter.put(
  "/",
  asyncHandler(async () => {
    throw new HttpError(403, "Delivery history cannot be edited.");
  }),
);

historyRouter.patch(
  "/",
  asyncHandler(async () => {
    throw new HttpError(403, "Delivery history cannot be edited.");
  }),
);

historyRouter.delete(
  "/",
  asyncHandler(async () => {
    throw new HttpError(403, "Delivery history cannot be deleted.");
  }),
);

historyRouter.patch(
  "/:id",
  asyncHandler(async () => {
    throw new HttpError(403, "Delivery history cannot be edited.");
  }),
);

historyRouter.delete(
  "/:id",
  asyncHandler(async () => {
    throw new HttpError(403, "Delivery history cannot be deleted.");
  }),
);
