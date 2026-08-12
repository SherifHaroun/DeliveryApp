import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { HttpError, asyncHandler } from "../lib/http.js";
import { CARD_STATUSES } from "../lib/serialize.js";

export const profileRouter = Router();

profileRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw new HttpError(404, "Account not found");
    }

    const [inCustody, delivered] = await Promise.all([
      prisma.card.count({
        where: {
          courierId: user.id,
          status: { in: [CARD_STATUSES.IN_CUSTODY, CARD_STATUSES.OTP_SENT] },
        },
      }),
      prisma.card.count({
        where: { courierId: user.id, status: CARD_STATUSES.DELIVERED },
      }),
    ]);

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      stats: { inCustody, delivered },
    });
  }),
);

profileRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const fullName = String(req.body?.fullName ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim();

    if (!fullName) {
      throw new HttpError(400, "Name is required");
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { fullName, phone: phone || null },
    });
    // Role and other account fields are never taken from the request body.

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    });
  }),
);

profileRouter.post(
  "/password",
  asyncHandler(async (req, res) => {
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");

    if (newPassword.length < 8) {
      throw new HttpError(400, "New password must be at least 8 characters");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw new HttpError(404, "Account not found");
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new HttpError(400, "Current password is incorrect");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });

    res.json({ ok: true });
  }),
);
