import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { lookupCard, takeCustody } from "../services/scanService.js";

export const scanRouter = Router();

scanRouter.post(
  "/lookup",
  asyncHandler(async (req, res) => {
    const result = await lookupCard(String(req.body?.qrToken ?? ""), req.user!.id);
    res.json(result);
  }),
);

scanRouter.post(
  "/custody",
  asyncHandler(async (req, res) => {
    const result = await takeCustody(String(req.body?.qrToken ?? ""), req.user!.id);
    res.json(result);
  }),
);
