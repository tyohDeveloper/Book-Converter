import { Router, Request, Response } from "express";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { getMimeTypeFromFilename } from "../../lib/file-manager/get-mime-type-from-filename";
import { isSourceFile } from "../../lib/file-manager/is-source-file";
import { asyncHandler } from "../../common/errors/error-middleware";
import { ValidationError } from "../../common/errors/specific-errors";
import { getSessionId, respond } from "../../common/http";
import { logger } from "../../common/logger";
import { streamUpload } from "../../lib/upload-stream";

const log = logger.child({ controller: "upload" });

export const uploadRouter = Router();

uploadRouter.post(
  "/files/upload",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const uploadedFiles: ManagedFile[] = [];

    log.info("Starting upload", { sessionId });
    const startTime = Date.now();

    const files = await streamUpload(req);

    if (files.length === 0) {
      throw new ValidationError("No files uploaded");
    }

    const uploadTime = Date.now() - startTime;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    log.info("Upload complete", {
      sessionId,
      fileCount: files.length,
      sizeMB: (totalSize / 1024 / 1024).toFixed(1),
      durationMs: uploadTime,
    });

    for (const file of files) {
      if (!isSourceFile(file.originalName)) {
        throw new ValidationError(`Unsupported file type: ${file.originalName}. Only PDF, DOCX, EPUB, HTML, XHTML, and CSS files are supported.`);
      }
      const mimeType = getMimeTypeFromFilename(file.originalName);
      const managedFile = await fileManager.addFile(
        sessionId,
        file.originalName,
        file.filePath,
        file.size,
        mimeType
      );
      uploadedFiles.push(managedFile);
    }

    respond(res, {
      files: uploadedFiles.map((f) => ({
        id: f.id,
        name: f.originalName,
        size: f.size,
        uploadedAt: f.uploadedAt,
      })),
    });
  })
);
