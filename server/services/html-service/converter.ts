import fs from "fs/promises";
import path from "path";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { sanitizeFilename } from "../../lib/file-manager/sanitize";
import { buildXhtmlDocument } from "../../lib/html-builder/build-xhtml-document";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import { cleanupTempFiles } from "../pipelines/text-prep";
import { extractFilesContent, extractSingleFileContent } from "./extractor";
import { renderPageAwareContent, renderSingleFileContent, renderSimpleContent } from "./renderer";
import { extractPdfFonts } from "../../lib/pdf-fonts/extract-pdf-fonts";
import { generateFontCss } from "../../lib/pdf-fonts/generate-font-css";
import type { HtmlConversionSettings, HtmlConversionResult, InternalHtmlResult } from "./types";

const log = logger.child({ service: "html" });

async function generateHtmlContent(
  sessionId: string,
  fileIds: string[],
  settings: HtmlConversionSettings,
  tempFiles: string[]
): Promise<string> {
  const { title = "Converted Document", includeTableOfContents = true, typography, bookStylePreset, skipCss = false } = settings;

  const extracted = await extractFilesContent(sessionId, fileIds, settings, tempFiles);

  let bodyContent: string;
  if ("simple" in extracted) {
    bodyContent = renderSimpleContent(extracted.simple, includeTableOfContents);
  } else {
    bodyContent = renderPageAwareContent(extracted.pageAware, includeTableOfContents);
  }

  const fontCssParts: string[] = [];
  for (const fileId of fileIds) {
    const css = await extractFontCssForPdf(sessionId, fileId);
    if (css) fontCssParts.push(css);
  }
  const fontCss = fontCssParts.join("\n\n");

  return buildXhtmlDocument({ title, content: bodyContent, typography, bookStylePreset, skipCss, fontCss });
}

async function extractFontCssForPdf(sessionId: string, fileId: string): Promise<string> {
  try {
    const pdfPath = await fileManager.downloadToTempFile(sessionId, fileId);
    const fontResult = await extractPdfFonts(pdfPath);
    await fs.unlink(pdfPath).catch(() => {});
    return generateFontCss(fontResult.fonts);
  } catch (err) {
    log.warn("Failed to extract fonts", { fileId, error: err });
    return "";
  }
}

async function generateIndividualXhtmlFiles(
  sessionId: string,
  fileIds: string[],
  settings: HtmlConversionSettings,
  tempFiles: string[]
): Promise<ManagedFile[]> {
  const { includeTableOfContents = true, typography, bookStylePreset, skipCss = false } = settings;
  const outputFiles: ManagedFile[] = [];

  for (const fileId of fileIds) {
    const extracted = await extractSingleFileContent(sessionId, fileId, settings, tempFiles);
    const bodyContent = renderSingleFileContent(extracted, includeTableOfContents);
    
    const fontCss = await extractFontCssForPdf(sessionId, fileId);
    const xhtml = buildXhtmlDocument({ title: extracted.name, content: bodyContent, typography, bookStylePreset, skipCss, fontCss });

    const xhtmlTempPath = path.join(config.uploads.baseDir, `xhtml-${Date.now()}-${fileId.slice(0,8)}.html`);
    await fs.writeFile(xhtmlTempPath, xhtml, "utf8");

    const xhtmlFileName = `${sanitizeFilename(extracted.name)}.html`;
    const outputFile = await fileManager.addOutputFile(sessionId, xhtmlFileName, xhtmlTempPath, "html");
    await fs.unlink(xhtmlTempPath).catch(() => {});
    outputFiles.push(outputFile);
    log.info("XHTML saved", { fileName: xhtmlFileName, fileId: outputFile.id });
  }

  return outputFiles;
}

export async function convertPdfsToHtmlInternal(
  sessionId: string,
  fileIds: string[],
  settings: HtmlConversionSettings
): Promise<InternalHtmlResult> {
  const tempFiles: string[] = [];

  try {
    log.info("Starting HTML conversion (internal)", { fileCount: fileIds.length, simpleExtraction: settings.simpleExtraction });
    
    const fullHtml = await generateHtmlContent(sessionId, fileIds, settings, tempFiles);
    const htmlTempPath = path.join(config.uploads.baseDir, `html-${Date.now()}.html`);
    await fs.writeFile(htmlTempPath, fullHtml, "utf8");
    tempFiles.push(htmlTempPath);

    return { htmlPath: htmlTempPath, tempFiles };
  } catch (error) {
    await cleanupTempFiles(tempFiles);
    throw error;
  }
}

export async function convertPdfsToHtml(
  sessionId: string,
  fileIds: string[],
  settings: HtmlConversionSettings
): Promise<HtmlConversionResult> {
  const tempFiles: string[] = [];

  try {
    log.info("Starting HTML conversion", { fileCount: fileIds.length, simpleExtraction: settings.simpleExtraction, preserveStyles: settings.preserveStyles });

    const outputFiles = await generateIndividualXhtmlFiles(sessionId, fileIds, settings, tempFiles);
    return { files: outputFiles };
  } finally {
    await cleanupTempFiles(tempFiles);
  }
}
