import { Router, Request, Response } from "express";
import fs from "fs/promises";
import { fileManager } from "../lib/file-manager/file-manager";
import { parsePDFFromFile, cleanupTempFile } from "../lib/pdf-parser";
import { extractPDFText } from "../lib/pdf-extractor/extractor";
import { analyzePDFStructure } from "../lib/pdf-structure/analyze-pdf-structure";
import { parseTableRows } from "../services/analysis/table-analysis";
import { asyncHandler } from "../common/errors/error-middleware";
import { ValidationError, FileNotFoundError } from "../common/errors/specific-errors";
import { cleanupFiles } from "../common/errors/error-helpers";
import { getSessionId, respond, validateBody } from "../common/http";
import { logger } from "../common/logger";
import { config } from "../common/config";
import { StructureRequestSchema, AnalyzeRequestSchema } from "@shared/contracts/analysis";

const log = logger.child({ controller: "analysis" });

export const analysisRouter = Router();

analysisRouter.post(
  "/tools/structure",
  validateBody(StructureRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds } = req.body;
    const tempPaths: string[] = [];

    try {
      const files = await fileManager.getFilesByIds(sessionId, fileIds);
      if (files.length === 0) throw new FileNotFoundError();

      const results = [];
      for (const file of files) {
        try {
          const tempPath = await fileManager.downloadToTempFile(sessionId, file.id);
          tempPaths.push(tempPath);
          const structure = await analyzePDFStructure(tempPath);
          results.push({ fileId: file.id, fileName: file.originalName, structure });
        } catch (err: any) {
          results.push({ fileId: file.id, fileName: file.originalName, error: err.message });
        }
      }

      respond(res, { results });
    } finally {
      await cleanupFiles(tempPaths);
    }
  })
);

analysisRouter.post(
  "/tools/analyze",
  validateBody(AnalyzeRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, detectChapters = true } = req.body;
    const tempPaths: string[] = [];

    try {
      const files = await fileManager.getFilesByIds(sessionId, fileIds);
      if (files.length === 0) throw new FileNotFoundError();

      const results = [];
      for (const file of files) {
        try {
          if (file.size > config.processing.analyzeSizeLimit) {
            log.info("Skipping chapter detection for large file", {
              fileName: file.originalName,
              sizeMB: (file.size / 1024 / 1024).toFixed(1),
            });
            results.push({
              fileId: file.id,
              fileName: file.originalName,
              totalPages: 0,
              chapters: [{ title: "Content", page: 1, content: "" }],
              preview: "",
              limitedAnalysis: true,
              message: "File is too large for chapter detection.",
            });
            continue;
          }

          const tempPath = await fileManager.downloadToTempFile(sessionId, file.id);
          tempPaths.push(tempPath);

          const parsed = await parsePDFFromFile(tempPath, detectChapters);
          if (parsed.tempTextFile) await cleanupTempFile(parsed.tempTextFile);

          results.push({
            fileId: file.id,
            fileName: file.originalName,
            totalPages: parsed.totalPages,
            chapters: parsed.chapters,
            preview: parsed.text.substring(0, config.processing.previewLength),
          });
        } catch (err: any) {
          results.push({ fileId: file.id, fileName: file.originalName, error: err.message });
        }
      }

      respond(res, { results });
    } finally {
      await cleanupFiles(tempPaths);
    }
  })
);

analysisRouter.post(
  "/debug/table-analysis",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.body;

    if (!fileId) throw new ValidationError("File ID required");

    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) throw new FileNotFoundError(fileId);

    const tempFilePath = await fileManager.downloadToTempFile(sessionId, fileId);
    const handle = extractPDFText(tempFilePath, true, () => {});
    const result = await handle.promise;

    if (!result.success || !result.tempTextFile) {
      await cleanupFiles([tempFilePath]);
      throw new Error("Failed to extract text");
    }

    const rawText = await fs.readFile(result.tempTextFile, "utf8");
    const rows = parseTableRows(rawText);
    const lines = rawText.split("\n");

    await cleanupFiles([tempFilePath, result.tempTextFile]);

    respond(res, {
      totalLines: lines.length,
      detectedRows: rows.length,
      rows: rows.map((r, i) => ({
        rowNum: i + 1,
        key: r.key,
        valuePreview: r.value.substring(0, 100) + (r.value.length > 100 ? "..." : ""),
      })),
    });
  })
);
