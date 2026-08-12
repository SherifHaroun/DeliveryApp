import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { HttpError, asyncHandler } from "../lib/http.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Invalid email or password");
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    res.json({
      token: signToken(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw new HttpError(401, "Account not found");
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    });
  }),
);
