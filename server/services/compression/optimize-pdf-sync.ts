import { fileManager } from "../../lib/file-manager/file-manager";
import { optimizePDFWithHandle, cleanupOptimizedFile } from "../../lib/pdf-optimizer";
import { cleanupFiles } from "../../common/errors/error-helpers";
import { logger } from "../../common/logger";
import type { ManagedFile } from "../../lib/file-manager/types";
import type { OptimizationResult } from "./optimize-pdf";

const log = logger.child({ service: "compression" });

export async function runSyncOptimization(
  sessionId: string,
  file: ManagedFile
): Promise<OptimizationResult> {
  let tempFilePath: string | null = null;

  try {
    log.info("Starting sync optimization", {
      fileName: file.originalName,
      sizeMB: (file.size / 1024 / 1024).toFixed(1),
    });

    tempFilePath = await fileManager.downloadToTempFile(sessionId, file.id);
    const { promise: optimizePromise } = optimizePDFWithHandle(tempFilePath);
    const result = await optimizePromise;

    if (!result.success) {
      throw new Error(result.error || "Optimization failed");
    }

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

    return {
      file: {
        id: outputFile.id,
        name: outputFile.originalName,
        size: outputFile.size,
        type: "compressed",
      },
      originalSize: file.size,
      optimizedSize: result.optimizedSize,
      reductionPercent: result.reduction,
    };
  } finally {
    if (tempFilePath) {
      await cleanupFiles([tempFilePath]);
    }
  }
}
