import { fileService } from "./file-service";
import { ConversionError, OperationCancelledError } from "../common/errors/specific-errors";
import { cleanupFiles } from "../common/errors/error-helpers";
import { optimizePDFWithHandle, cleanupOptimizedFile } from "../lib/pdf-optimizer";
import { progressManager } from "../lib/progress-manager";
import crypto from "crypto";
import { logger } from "../common/logger";

const log = logger.child({ service: "compression" });

export interface CompressionResult {
  fileId: string;
  fileName: string;
  size: number;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
}

export class CompressionService {
  async startCompression(sessionId: string, fileId: string): Promise<string> {
    const file = await fileService.getFile(sessionId, fileId);
    const operationId = crypto.randomUUID();

    progressManager.startOperation(operationId);

    this.runCompression(sessionId, file.id, file.originalName, file.size, operationId).catch(
      (err) => {
        log.error("compression error", { operationId, error: err.message });
        if (!progressManager.isCancelled(operationId)) {
          progressManager.complete(operationId, false, null, err.message);
        }
      }
    );

    return operationId;
  }

  private async runCompression(
    sessionId: string,
    fileId: string,
    fileName: string,
    fileSize: number,
    operationId: string
  ): Promise<void> {
    let tempFilePath: string | null = null;

    try {
      if (progressManager.isCancelled(operationId)) {
        progressManager.finishOperation(operationId);
        return;
      }

      progressManager.update(operationId, {
        stage: "starting",
        percent: 5,
        message: "Starting PDF compression...",
      });

      tempFilePath = await fileService.downloadToTempFile(sessionId, fileId);

      const handle = optimizePDFWithHandle(tempFilePath, (progress) => {
        if (progressManager.isCancelled(operationId)) {
          return;
        }

        const percent =
          progress.stage === "starting"
            ? 10
            : progress.stage === "processing"
            ? 50
            : progress.stage === "complete"
            ? 90
            : 5;

        progressManager.update(operationId, {
          stage: progress.stage,
          percent,
          message: progress.message,
        });
      });

      progressManager.setCancelFn(operationId, handle.cancel);

      const result = await handle.promise;

      if (result.outputPath && (progressManager.isCancelled(operationId) || !result.success)) {
        cleanupOptimizedFile(result.outputPath);
      }

      if (progressManager.isCancelled(operationId)) {
        log.info("compression cancelled", { operationId });
        progressManager.finishOperation(operationId);
        return;
      }

      if (!result.success) {
        progressManager.complete(operationId, false, null, result.error || "Optimization failed");
        return;
      }

      progressManager.update(operationId, {
        stage: "saving",
        percent: 95,
        message: "Saving compressed file...",
      });

      const optimizedName = fileName
        .replace(".pdf", "_compressed.pdf")
        .replace(".PDF", "_compressed.pdf");
      const outputFile = await fileService.addOutputFile(
        sessionId,
        optimizedName,
        result.outputPath,
        "compressed"
      );
      cleanupOptimizedFile(result.outputPath);

      const compressionResult: CompressionResult = {
        fileId: outputFile.id,
        fileName: outputFile.originalName,
        size: outputFile.size,
        originalSize: fileSize,
        optimizedSize: result.optimizedSize,
        reductionPercent: result.reduction,
      };

      progressManager.complete(operationId, true, {
        file: {
          id: outputFile.id,
          name: outputFile.originalName,
          size: outputFile.size,
          type: "compressed",
        },
        originalSize: fileSize,
        optimizedSize: result.optimizedSize,
        reductionPercent: result.reduction,
      });
    } catch (err: any) {
      if (!progressManager.isCancelled(operationId)) {
        progressManager.complete(operationId, false, null, err.message);
      }
      throw err;
    } finally {
      if (tempFilePath) {
        await cleanupFiles([tempFilePath]);
      }
    }
  }

  cancelOperation(operationId: string): boolean {
    if (progressManager.hasOperation(operationId)) {
      progressManager.cancelOperation(operationId);
      return true;
    }
    return false;
  }
}

export const compressionService = new CompressionService();
