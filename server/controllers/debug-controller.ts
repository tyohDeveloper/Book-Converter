import { Router, Request, Response } from "express";
import { fileManager } from "../lib/file-manager/file-manager";
import { extractPDFElements } from "../services/pdf-debug";
import type { DebugMode } from "../services/pdf-debug/types";
import { asyncHandler } from "../common/errors/error-middleware";
import { ValidationError, FileNotFoundError } from "../common/errors/specific-errors";
import { cleanupFiles } from "../common/errors/error-helpers";
import { getSessionId, respond, validateBody } from "../common/http";
import { logger } from "../common/logger";
import { z } from "zod";

const log = logger.child({ controller: "debug" });

export const debugRouter = Router();

const DebugRequestSchema = z.object({
  fileId: z.string(),
  mode: z.enum(["operators", "pdfjsText", "poppler", "textBlocks"]).optional().default("textBlocks"),
  pageRange: z.object({
    start: z.number().int().min(1).optional(),
    end: z.number().int().min(1).optional(),
  }).optional(),
});

debugRouter.post(
  "/debug/pdf-elements",
  validateBody(DebugRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, mode, pageRange } = req.body;
    const tempPaths: string[] = [];

    try {
      const files = await fileManager.getFilesByIds(sessionId, [fileId]);
      if (files.length === 0) {
        throw new FileNotFoundError();
      }

      const file = files[0];
      const tempPath = await fileManager.downloadToTempFile(sessionId, file.id);
      tempPaths.push(tempPath);

      log.info("Extracting PDF elements for debug", {
        fileName: file.originalName,
        fileId,
        mode,
      });

      const debugInfo = await extractPDFElements(tempPath, file.originalName, mode as DebugMode);

      if (pageRange && debugInfo.pages) {
        const start = pageRange.start ?? 1;
        const end = pageRange.end ?? debugInfo.numPages;
        (debugInfo as any).pages = debugInfo.pages.filter(
          (p: any) => p.pageNumber >= start && p.pageNumber <= end
        );
      }

      respond(res, debugInfo);
    } finally {
      await cleanupFiles(tempPaths);
    }
  })
);
