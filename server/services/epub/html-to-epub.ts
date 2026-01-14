import fs from "fs";
import path from "path";
import { fileManager } from "../../lib/file-manager/file-manager";
import { generateEPUBFromHtml } from "../../lib/epub/from-html";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import type { EpubConversionSettings, EpubConversionResult } from "./types";
import { sanitizeFilename } from "./utils";

const log = logger.child({ service: "epub" });

export async function convertHtmlToEpub(
  sessionId: string,
  fileId: string,
  settings: EpubConversionSettings
): Promise<EpubConversionResult> {
  let tempFilePath: string | null = null;

  try {
    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new ConversionError("File not found");
    }

    const lowerName = file.originalName.toLowerCase();
    if (!lowerName.endsWith(".html") && !lowerName.endsWith(".xhtml")) {
      throw new ConversionError("File must be an HTML or XHTML file. Use the HTML converter first to process PDFs.");
    }

    const {
      title = file.originalName.replace(/\.x?html$/i, ""),
      author = "Unknown",
      compressionLevel = "maximum",
    } = settings;

    log.info("Converting HTML to EPUB", { fileName: file.originalName });

    tempFilePath = await fileManager.downloadToTempFile(sessionId, fileId);

    const epubBuffer = await generateEPUBFromHtml({
      htmlPath: tempFilePath,
      title,
      author,
      compressionLevel,
      typography: settings.typography,
    });

    const epubTempPath = path.join(config.uploads.baseDir, `epub-${Date.now()}.epub`);
    await fs.promises.writeFile(epubTempPath, epubBuffer);

    const epubFileName = `${sanitizeFilename(title)}.epub`;
    const outputFile = await fileManager.addOutputFile(sessionId, epubFileName, epubTempPath, "epub");

    await fs.promises.unlink(epubTempPath).catch(() => {});

    log.info("EPUB saved", { fileName: epubFileName, fileId: outputFile.id });

    return { file: outputFile };
  } finally {
    if (tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
  }
}
