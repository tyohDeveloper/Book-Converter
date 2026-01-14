import { fileManager } from "../../lib/file-manager/file-manager";
import { optimizePDFWithHandle, cleanupOptimizedFile } from "../../lib/pdf-optimizer";
import { progressManager } from "../../lib/progress-manager";
import { cleanupFiles } from "../../common/errors/error-helpers";
import { logger } from "../../common/logger";
import type { ManagedFile } from "../../lib/file-manager/types";

const log = logger.child({ service: "compression" });

export interface OptimizationResult {
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
  };
  originalSize: number;
  optimizedSize?: number;
  reductionPercent?: number;
}

export async function runOptimization(
  sessionId: string,
  file: ManagedFile,
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

    tempFilePath = await fileManager.downloadToTempFile(sessionId, file.id);

    if (progressManager.isCancelled(operationId)) {
      progressManager.finishOperation(operationId);
      return;
    }

    progressManager.update(operationId, {
      stage: "processing",
      percent: 20,
      message: "Compressing PDF...",
    });

    const { promise: optimizePromise, cancel } = optimizePDFWithHandle(tempFilePath);

    const checkCancellation = setInterval(() => {
      if (progressManager.isCancelled(operationId)) {
        cancel();
      }
    }, 500);

    const result = await optimizePromise;
    clearInterval(checkCancellation);

    if (progressManager.isCancelled(operationId)) {
      if (result.outputPath) {
        cleanupOptimizedFile(result.outputPath);
      }
      progressManager.finishOperation(operationId);
      return;
    }

    if (!result.success) {
      throw new Error(result.error || "Optimization failed");
    }

    progressManager.update(operationId, {
      stage: "saving",
      percent: 95,
      message: "Saving compressed file...",
    });

    const optimizedName = file.originalName
      .replace(".pdf", "_compressed.pdf")
      .replace(".PDF", "_compressed.pdf");

    const outputFile = await fileManager.addOutputFile(
      sessionId,
      optimizedName,
      result.outputPath!,
      "compressed"
    );
    cleanupOptimizedFile(result.outputPath!);

    log.info("Compression complete", {
      fileName: optimizedName,
      sizeMB: (outputFile.size / 1024 / 1024).toFixed(1),
      reduction: result.reduction?.toFixed(1) + "%",
    });

    progressManager.complete(operationId, true, {
      file: {
        id: outputFile.id,
        name: outputFile.originalName,
        size: outputFile.size,
        type: "compressed",
      },
      originalSize: file.size,
      optimizedSize: result.optimizedSize,
      reductionPercent: result.reduction,
    });
  } catch (error: any) {
    log.error("Optimization error", { error: error.message });
    if (!progressManager.isCancelled(operationId)) {
      progressManager.complete(operationId, false, null, error.message);
    } else {
      progressManager.finishOperation(operationId);
    }
  } finally {
    if (tempFilePath) {
      await cleanupFiles([tempFilePath]);
    }
  }
}
