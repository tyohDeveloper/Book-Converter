import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { ValidationError } from "./errors/specific-errors";
import { logger } from "./logger";

const log = logger.child({ service: "http-session" });

export function respond<T>(res: Response, data: T, statusCode: number = 200): void {
  res.status(statusCode).json(data);
}

export function validateBody<T extends z.ZodSchema>(
  schema: T
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new ValidationError("Invalid request body", messages);
    }
    req.body = result.data;
    next();
  };
}

export function getSessionId(req: Request): string {
  const sessionId = req.headers["x-session-id"] as string | undefined;
  const resolvedId = sessionId || "default-session";
  if (!sessionId) {
    log.warn("Missing X-Session-Id header, using default", { 
      path: req.path, 
      method: req.method,
      userAgent: req.headers["user-agent"]?.substring(0, 50) 
    });
  } else {
    log.debug("Session ID from header", { sessionId: resolvedId.substring(0, 8) + "...", path: req.path });
  }
  return resolvedId;
}
