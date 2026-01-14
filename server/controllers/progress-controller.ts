import { Router, Request, Response } from "express";
import { progressManager } from "../lib/progress-manager";
import { OperationNotFoundError } from "../common/errors/specific-errors";
import { respond } from "../common/http";

export const progressRouter = Router();

progressRouter.get("/progress/:operationId", (req: Request, res: Response) => {
  const { operationId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  progressManager.addClient(operationId, res);

  req.on("close", () => {
    progressManager.removeClient(operationId, res);
  });
});

progressRouter.delete("/progress/:operationId", (req: Request, res: Response) => {
  const { operationId } = req.params;

  if (progressManager.hasOperation(operationId)) {
    progressManager.cancelOperation(operationId);
    respond(res, { cancelled: true });
  } else {
    throw new OperationNotFoundError(operationId);
  }
});
