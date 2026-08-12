import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError, asyncHandler } from "../lib/http.js";
import { CARD_STATUSES, serializeCard } from "../lib/serialize.js";
import { getDeliveryForCourier, sendOtp, verifyOtp } from "../services/otpService.js";

const cardInclude = {
  customer: true,
  courier: true,
  activities: { orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }], take: 1 },
};

const ASSIGNED_STATUSES = [
  CARD_STATUSES.IN_CUSTODY,
  CARD_STATUSES.OTP_SENT,
  CARD_STATUSES.DELIVERED,
] as const;

export const deliveriesRouter = Router();

deliveriesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const courierId = req.user!.id;
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const sort = typeof req.query.sort === "string" ? req.query.sort : "assignedAt";
    const dir: Prisma.SortOrder = req.query.dir === "asc" ? "asc" : "desc";

    const where: Prisma.CardWhereInput = {
      courierId,
      status:
        status && ASSIGNED_STATUSES.includes(status as (typeof ASSIGNED_STATUSES)[number])
          ? status
          : { in: [...ASSIGNED_STATUSES] },
    };

    if (q) {
      where.OR = [
        { identifier: { contains: q } },
        { last4: { contains: q } },
        { customer: { fullName: { contains: q } } },
        { customer: { email: { contains: q } } },
        { customer: { city: { contains: q } } },
      ];
    }

    const orderBy: Prisma.CardOrderByWithRelationInput =
      sort === "customer"
        ? { customer: { fullName: dir } }
        : sort === "status"
          ? { status: dir }
          : sort === "updated"
            ? { updatedAt: dir }
            : { scannedAt: dir };

    const cards = await prisma.card.findMany({
      where,
      include: cardInclude,
      orderBy,
    });

    res.json(
      cards.map((card) => serializeCard(card, null, card.activities[0] ?? null)),
    );
  }),
);

deliveriesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await getDeliveryForCourier(req.params.id, req.user!.id));
  }),
);

deliveriesRouter.post(
  "/:id/send-otp",
  asyncHandler(async (req, res) => {
    // Destination is always the customer's registered email from the database.
    void req.body;
    const card = await sendOtp(req.params.id, req.user!.id);
    res.json({ card });
  }),
);

deliveriesRouter.post(
  "/:id/verify-otp",
  asyncHandler(async (req, res) => {
    const card = await verifyOtp(req.params.id, req.user!.id, String(req.body?.code ?? ""));
    res.json(card);
  }),
);

deliveriesRouter.post(
  "/:id/deliver",
  asyncHandler(async () => {
    throw new HttpError(403, "Cards can only be marked delivered after OTP verification.");
  }),
);

deliveriesRouter.patch(
  "/:id/status",
  asyncHandler(async () => {
    throw new HttpError(403, "Cards can only be marked delivered after OTP verification.");
  }),
);
