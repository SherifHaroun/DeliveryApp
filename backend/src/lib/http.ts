export class HttpError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<unknown>,
) {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
