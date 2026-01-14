import { fileService } from "./file-service";
import { cleanupFiles } from "../common/errors/error-helpers";
import { parsePDFFromFile, cleanupTempFile } from "../lib/pdf-parser";
import { analyzePDFStructure } from "../lib/pdf-structure/analyze-pdf-structure";
import { combinePDFs } from "../lib/pdf-combiner";
import { processFilesWithResults, withTempFiles } from "./with-temp-files";
import path from "path";
import fs from "fs/promises";
import { UPLOADS_BASE } from "../domain/paths";

const ANALYZE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB

export interface AnalyzeResult {
  fileId: string;
  fileName: string;
  totalPages?: number;
  chapters?: Array<{ title: string; page: number; content?: string }>;
  preview?: string;
  error?: string;
  limitedAnalysis?: boolean;
  message?: string;
}

export interface StructureResult {
  fileId: string;
  fileName: string;
  structure?: any;
  error?: string;
}

export interface CombineResult {
  fileId: string;
  fileName: string;
  size: number;
}

export class AnalysisService {
  async analyzeFiles(
    sessionId: string,
    fileIds: string[],
    detectChapters: boolean = true
  ): Promise<AnalyzeResult[]> {
    return processFilesWithResults<AnalyzeResult>(
      sessionId,
      fileIds,
      async ({ file, tempPath }): Promise<AnalyzeResult> => {
        if (file.size > ANALYZE_SIZE_LIMIT) {
          return {
            fileId: file.id,
            fileName: file.originalName,
            totalPages: 0,
            chapters: [{ title: "Content", page: 1, content: "" }],
            preview: "",
            limitedAnalysis: true,
            message: "File is too large for chapter detection. It will be converted as a single chapter.",
          };
        }

        const parsed = await parsePDFFromFile(tempPath, detectChapters);

        if (parsed.tempTextFile) {
          await cleanupTempFile(parsed.tempTextFile);
        }

        return {
          fileId: file.id,
          fileName: file.originalName,
          totalPages: parsed.totalPages,
          chapters: parsed.chapters,
          preview: parsed.text.substring(0, 2000),
        };
      },
      (file, err): AnalyzeResult => ({
        fileId: file.id,
        fileName: file.originalName,
        error: err.message,
      })
    );
  }

  async analyzeStructure(sessionId: string, fileIds: string[]): Promise<StructureResult[]> {
    return processFilesWithResults<StructureResult>(
      sessionId,
      fileIds,
      async ({ file, tempPath }): Promise<StructureResult> => {
        const structure = await analyzePDFStructure(tempPath);
        return {
          fileId: file.id,
          fileName: file.originalName,
          structure,
        };
      },
      (file, err): StructureResult => ({
        fileId: file.id,
        fileName: file.originalName,
        error: err.message,
      })
    );
  }

  async combinePDFs(
    sessionId: string,
    fileIds: string[],
    outputName: string = "combined.pdf"
  ): Promise<CombineResult> {
    const files = await fileService.getFilesByIds(sessionId, fileIds);

    if (files.length < 2) {
      throw new Error("At least 2 files required to combine");
    }

    return withTempFiles(sessionId, fileIds, async (contexts) => {
      const filePaths = contexts.map((c) => c.tempPath);
      const combinedBuffer = await combinePDFs(filePaths);

      const tempCombinedPath = path.join(UPLOADS_BASE, `temp-combined-${Date.now()}.pdf`);
      await fs.writeFile(tempCombinedPath, combinedBuffer);

      const outputFile = await fileService.addOutputFile(
        sessionId,
        outputName,
        tempCombinedPath,
        "pdf"
      );
      await fs.unlink(tempCombinedPath).catch(() => {});

      return {
        fileId: outputFile.id,
        fileName: outputFile.originalName,
        size: outputFile.size,
      };
    });
  }
}

export const analysisService = new AnalysisService();
