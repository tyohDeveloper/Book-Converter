import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { ErrorCode } from "./error-codes";
import { AppError } from "./app-error";

const log = logger.child({ module: "errors" });

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  log.error("request error", { method: req.method, path: req.path, error: err.message });
  if (process.env.NODE_ENV !== "production") {
    log.debug("error stack", { stack: err.stack });
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  if (err.name === "MulterError") {
    const multerErr = err as any;
    log.error("multer upload error", { 
      code: multerErr.code, 
      field: multerErr.field,
      message: err.message 
    });
    res.status(400).json({
      error: err.message,
      code: ErrorCode.UPLOAD_FAILED,
    });
    return;
  }

  res.status(500).json({
    error: "An unexpected error occurred",
    code: ErrorCode.INTERNAL_ERROR,
    ...(process.env.NODE_ENV !== "production" && { details: err.message }),
  });
}

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
