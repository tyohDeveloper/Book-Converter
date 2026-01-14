import fs from "fs/promises";
import path from "path";
import libre from "libreoffice-convert";
import { promisify } from "util";
import { fileManager } from "../../lib/file-manager/file-manager";
import { sanitizeFilename } from "../../lib/file-manager/sanitize";
import { isDocxFile } from "../../lib/file-manager/is-docx-file";
import { generateEPUBFromHtml } from "../../lib/epub/from-html";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import { extractDocxContents } from "./extract-contents";
import { buildCombinedHtml } from "./build-combined-html";
import type { DocxConversionSettings, DocxConversionResult } from "./types";

const log = logger.child({ service: "docx" });
const convertAsync = promisify(libre.convert);

export async function convertDocxToHtml(
  sessionId: string,
  fileIds: string[],
  settings: DocxConversionSettings = {}
): Promise<DocxConversionResult> {
  const { fileContents, firstFileName, tempFilePaths } = await extractDocxContents(sessionId, fileIds);

  try {
    const { html, title } = buildCombinedHtml({ fileContents, firstFileName, settings });

    const htmlTempPath = path.join(config.uploads.baseDir, `docx-html-${Date.now()}.html`);
    await fs.writeFile(htmlTempPath, html, "utf-8");

    const htmlFileName = `${sanitizeFilename(title)}.html`;
    const outputFile = await fileManager.addOutputFile(sessionId, htmlFileName, htmlTempPath, "html");

    await fs.unlink(htmlTempPath).catch(() => {});
    log.info("HTML saved from DOCX", { fileName: htmlFileName, fileId: outputFile.id, fileCount: fileContents.length });

    return { file: outputFile };
  } finally {
    for (const tempPath of tempFilePaths) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}

export async function convertDocxToEpub(
  sessionId: string,
  fileIds: string[],
  settings: DocxConversionSettings = {}
): Promise<DocxConversionResult> {
  const { fileContents, firstFileName, tempFilePaths } = await extractDocxContents(sessionId, fileIds);
  let htmlTempPath: string | null = null;

  try {
    const { html, title } = buildCombinedHtml({ fileContents, firstFileName, settings });
    const author = settings.author || "Unknown";

    htmlTempPath = path.join(config.uploads.baseDir, `docx-epub-temp-${Date.now()}.html`);
    await fs.writeFile(htmlTempPath, html, "utf-8");

    const epubBuffer = await generateEPUBFromHtml({
      htmlPath: htmlTempPath,
      title,
      author,
      compressionLevel: "maximum",
    });

    const epubTempPath = path.join(config.uploads.baseDir, `docx-epub-${Date.now()}.epub`);
    await fs.writeFile(epubTempPath, epubBuffer);

    const epubFileName = `${sanitizeFilename(title)}.epub`;
    const outputFile = await fileManager.addOutputFile(sessionId, epubFileName, epubTempPath, "epub");

    await fs.unlink(epubTempPath).catch(() => {});
    log.info("EPUB saved from DOCX", { fileName: epubFileName, fileId: outputFile.id, fileCount: fileContents.length });

    return { file: outputFile };
  } finally {
    for (const tempPath of tempFilePaths) {
      await fs.unlink(tempPath).catch(() => {});
    }
    if (htmlTempPath) {
      await fs.unlink(htmlTempPath).catch(() => {});
    }
  }
}

export async function convertDocxToPdf(
  sessionId: string,
  fileIds: string[],
  settings: DocxConversionSettings = {}
): Promise<DocxConversionResult> {
  if (fileIds.length > 1) {
    throw new ConversionError("PDF conversion only supports single DOCX files. Use HTML or EPUB for multiple files.");
  }

  const fileId = fileIds[0];
  let tempFilePath: string | null = null;

  try {
    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) throw new ConversionError("File not found");
    if (!isDocxFile(file.originalName)) throw new ConversionError("File must be a DOCX file");

    const title = settings.title || file.originalName.replace(/\.docx$/i, "");
    log.info("Converting DOCX to PDF", { fileName: file.originalName });

    tempFilePath = await fileManager.downloadToTempFile(sessionId, fileId);
    const docxBuffer = await fs.readFile(tempFilePath);
    const pdfBuffer = await convertAsync(docxBuffer, ".pdf", undefined);

    const pdfTempPath = path.join(config.uploads.baseDir, `docx-pdf-${Date.now()}.pdf`);
    await fs.writeFile(pdfTempPath, pdfBuffer);

    const pdfFileName = `${sanitizeFilename(title)}.pdf`;
    const outputFile = await fileManager.addOutputFile(sessionId, pdfFileName, pdfTempPath, "pdf");

    await fs.unlink(pdfTempPath).catch(() => {});
    log.info("PDF saved from DOCX", { fileName: pdfFileName, fileId: outputFile.id });

    return { file: outputFile };
  } finally {
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }
}
