import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./lib/prisma.js";
import { isMemoryDataMode } from "./config/dataMode.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { deliveriesRouter } from "./routes/deliveries.js";
import { scanRouter } from "./routes/scan.js";
import { historyRouter } from "./routes/history.js";
import { profileRouter } from "./routes/profile.js";
import { statsRouter } from "./routes/stats.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";

function isAllowedOrigin(origin: string) {
  const configured = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5174")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configured.includes("*") || configured.includes(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
    return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        ok: true,
        service: "delivery-app",
        database: isMemoryDataMode() ? "memory" : "connected",
        release: "2026-08-15",
      });
    } catch {
      res.status(503).json({ ok: false, service: "delivery-app", database: "disconnected" });
    }
  });
  app.get("/", (_req, res) => {
    res.json({ service: "delivery-app", health: "/api/health" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/deliveries", requireAuth, deliveriesRouter);
  app.use("/api/scan", requireAuth, scanRouter);
  app.use("/api/history", requireAuth, historyRouter);
  app.use("/api/profile", requireAuth, profileRouter);
  app.use("/api/stats", requireAuth, statsRouter);

  app.use(errorHandler);
  return app;
}
