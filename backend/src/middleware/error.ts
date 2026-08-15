import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Unexpected error";

  if (status >= 500) {
    console.error(err);
  }

  const clientMessage =
    err instanceof HttpError ? err.message : status >= 500 ? "Something went wrong" : message;

  res.status(status).json({
    error: clientMessage,
    ...(err instanceof HttpError && err.details ? err.details : {}),
  });
}
