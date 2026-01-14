import fs from "fs/promises";
import path from "path";
import { fileManager } from "../lib/file-manager/file-manager";
import type { ManagedFile } from "../lib/file-manager/types";
import { combinePDFs } from "../lib/pdf-combiner";
import { ConversionError } from "../common/errors/specific-errors";
import { cleanupFiles } from "../common/errors/error-helpers";
import { logger } from "../common/logger";
import { config } from "../common/config";

const log = logger.child({ service: "combine" });

export interface CombineResult {
  file: ManagedFile;
}

export async function combinePdfFiles(
  sessionId: string,
  fileIds: string[],
  outputName: string = "combined.pdf"
): Promise<CombineResult> {
  const tempPaths: string[] = [];

  try {
    const files = await fileManager.getFilesByIds(sessionId, fileIds);
    if (files.length < 2) {
      throw new ConversionError("At least 2 files required to combine");
    }

    log.info("Combining PDFs", { fileCount: files.length });

    for (const file of files) {
      const tempPath = await fileManager.downloadToTempFile(sessionId, file.id);
      tempPaths.push(tempPath);
    }

    const combinedBuffer = await combinePDFs(tempPaths);

    const combinedTempPath = path.join(config.uploads.baseDir, `combined-${Date.now()}.pdf`);
    await fs.writeFile(combinedTempPath, combinedBuffer);

    const finalName = outputName;
    const outputFile = await fileManager.addOutputFile(
      sessionId,
      finalName,
      combinedTempPath,
      "pdf"
    );

    await cleanupFiles([combinedTempPath]);

    log.info("Combined PDF saved", { fileName: finalName, fileId: outputFile.id });

    return { file: outputFile };
  } finally {
    await cleanupFiles(tempPaths);
  }
}
