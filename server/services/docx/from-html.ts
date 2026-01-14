import fs from "fs/promises";
import path from "path";
import HTMLtoDOCX from "html-to-docx";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { sanitizeFilename } from "../../lib/file-manager/sanitize";
import { isHtmlFile } from "../../lib/file-manager/is-html-file";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import { injectTocIntoHtml } from "./toc-builder";
import type { HtmlToDocxSettings, DocxConversionResult, BatchDocxConversionResult } from "./types";

const log = logger.child({ service: "docx" });

function normalizeSemanticTags(html: string): string {
  return html
    .replace(/<em(\s|>)/gi, "<i$1")
    .replace(/<\/em>/gi, "</i>")
    .replace(/<strong(\s|>)/gi, "<b$1")
    .replace(/<\/strong>/gi, "</b>");
}

export async function convertHtmlToDocx(
  sessionId: string,
  fileIds: string[],
  settings: HtmlToDocxSettings = {}
): Promise<DocxConversionResult | BatchDocxConversionResult> {
  const tempFilePaths: string[] = [];
  const mode = settings.mode || 'combine';

  try {
    const allFiles = await fileManager.getFilesByIds(sessionId, fileIds);
    const files = allFiles.filter(f => isHtmlFile(f.originalName));
    
    if (files.length === 0) {
      throw new ConversionError("No HTML files selected");
    }

    if (mode === 'batch') {
      const outputFiles: ManagedFile[] = [];
      const author = settings.author || "Digital Bindery";

      for (const file of files) {
        const fileTitle = file.originalName.replace(/\.(html?|xhtml)$/i, "");
        log.info("Batch converting HTML to DOCX", { fileName: file.originalName });

        const tempFilePath = await fileManager.downloadToTempFile(sessionId, file.id);
        tempFilePaths.push(tempFilePath);
        
        const rawHtml = await fs.readFile(tempFilePath, "utf-8");
        const htmlContent = normalizeSemanticTags(rawHtml);

        const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
          title: fileTitle,
          creator: author,
          table: { row: { cantSplit: true } },
          footer: false,
          pageNumber: false,
        });

        const docxTempPath = path.join(config.uploads.baseDir, `html-docx-${Date.now()}-${Math.random().toString(36).slice(2)}.docx`);
        await fs.writeFile(docxTempPath, docxBuffer);

        const docxFileName = `${sanitizeFilename(fileTitle)}.docx`;
        const outputFile = await fileManager.addOutputFile(sessionId, docxFileName, docxTempPath, "docx");
        outputFiles.push(outputFile);

        await fs.unlink(docxTempPath).catch(() => {});
        log.info("DOCX saved from HTML (batch)", { fileName: docxFileName, fileId: outputFile.id });
      }

      return { files: outputFiles };
    }

    const firstFileName = files[0].originalName.replace(/\.(html?|xhtml)$/i, "");
    const title = settings.title || (files.length > 1 ? "Combined Documents" : firstFileName);
    const author = settings.author || "Digital Bindery";

    let combinedHtml = "";

    for (const file of files) {
      log.info("Converting HTML to DOCX", { fileName: file.originalName });

      const tempFilePath = await fileManager.downloadToTempFile(sessionId, file.id);
      tempFilePaths.push(tempFilePath);
      
      const rawHtml = await fs.readFile(tempFilePath, "utf-8");
      combinedHtml += rawHtml + "\n";
    }

    const normalizedHtml = normalizeSemanticTags(combinedHtml);
    const includeToc = files.length > 1 || settings.includeToc;
    
    const finalHtml = includeToc
      ? injectTocIntoHtml(normalizedHtml, title)
      : normalizedHtml;
    
    const docxBuffer = await HTMLtoDOCX(finalHtml, null, {
      title,
      creator: author,
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
      decodeUnicode: true,
    });

    const docxTempPath = path.join(config.uploads.baseDir, `html-docx-${Date.now()}.docx`);
    await fs.writeFile(docxTempPath, docxBuffer);

    const docxFileName = `${sanitizeFilename(title)}.docx`;
    const outputFile = await fileManager.addOutputFile(sessionId, docxFileName, docxTempPath, "docx");

    await fs.unlink(docxTempPath).catch(() => {});
    log.info("DOCX saved from HTML", { fileName: docxFileName, fileId: outputFile.id, fileCount: files.length });

    return { file: outputFile };
  } finally {
    for (const tempPath of tempFilePaths) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}
