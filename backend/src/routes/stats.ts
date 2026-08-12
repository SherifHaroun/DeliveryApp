import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { deliveryReportingService } from "../services/deliveryReportingService.js";

export const statsRouter = Router();

statsRouter.get(
  "/delivered-count",
  asyncHandler(async (_req, res) => {
    const report = await deliveryReportingService.getDeliveredCountReport();
    res.json(report);
  }),
);
