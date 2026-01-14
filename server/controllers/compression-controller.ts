import { Router, Request, Response } from "express";
import crypto from "crypto";
import { fileManager } from "../lib/file-manager/file-manager";
import { progressManager } from "../lib/progress-manager";
import { runOptimization } from "../services/compression/optimize-pdf";
import { runSyncOptimization } from "../services/compression/optimize-pdf-sync";
import { asyncHandler } from "../common/errors/error-middleware";
import { FileNotFoundError } from "../common/errors/specific-errors";
import { getSessionId, respond, validateBody } from "../common/http";
import { logger } from "../common/logger";
import { OptimizeRequestSchema } from "@shared/contracts/conversion";

const log = logger.child({ controller: "compression" });

export const compressionRouter = Router();

compressionRouter.post(
  "/tools/optimize",
  validateBody(OptimizeRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds } = req.body;

    const file = await fileManager.getFile(sessionId, fileIds[0]);
    if (!file) throw new FileNotFoundError(fileIds[0]);

    const operationId = crypto.randomUUID();
    progressManager.startOperation(operationId);

    log.info("Starting optimization", {
      fileName: file.originalName,
      sizeMB: (file.size / 1024 / 1024).toFixed(1),
      operationId,
    });

    respond(res, { operationId, started: true });

    void runOptimization(sessionId, file, operationId);
  })
);

compressionRouter.post(
  "/tools/optimize-sync",
  validateBody(OptimizeRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds } = req.body;

    const file = await fileManager.getFile(sessionId, fileIds[0]);
    if (!file) throw new FileNotFoundError(fileIds[0]);

    const result = await runSyncOptimization(sessionId, file);

    respond(res, { success: true, ...result });
  })
);
