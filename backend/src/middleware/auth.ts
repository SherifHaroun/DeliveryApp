import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http.js";
import { verifyToken } from "../lib/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    next(new HttpError(401, "Sign in required"));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, "Session expired. Please sign in again."));
  }
}
