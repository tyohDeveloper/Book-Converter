import fs from "fs/promises";
import { JSDOM } from "jsdom";
import { fileManager } from "../../lib/file-manager/file-manager";
import { isHtmlFile } from "../../lib/file-manager/is-html-file";
import { isCssFile } from "../../lib/file-manager/is-css-file";
import { ConversionError } from "../../common/errors/specific-errors";
import { deduplicateCss } from "../../lib/css/deduplicate-css";
import { parseStylesheet } from "../../lib/css/parse-stylesheet";
import { mergeStylesheets } from "../../lib/css/merge-stylesheets";
import type { ParsedStylesheet } from "@shared/contracts/css-editor";

export interface MultiFileInfo {
  id: string;
  name: string;
  size: number;
}

export interface MultiCssStylesResult {
  styles: string;
  parsed: ParsedStylesheet;
  files: MultiFileInfo[];
}

async function extractCssFromHtmlFile(sessionId: string, fileId: string): Promise<string> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file || !isHtmlFile(file.originalName)) {
    throw new ConversionError(`Invalid HTML file: ${fileId}`);
  }

  const tempPath = await fileManager.downloadToTempFile(sessionId, fileId);
  try {
    const content = await fs.readFile(tempPath, "utf8");
    const dom = new JSDOM(content);
    const doc = dom.window.document;

    const styleElements = doc.querySelectorAll("style");
    const rawStyles = Array.from(styleElements)
      .map(el => el.textContent || "")
      .join("\n");
    
    return deduplicateCss(rawStyles);
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

async function extractCssFromCssFile(sessionId: string, fileId: string): Promise<string> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file || !isCssFile(file.originalName)) {
    throw new ConversionError(`Invalid CSS file: ${fileId}`);
  }

  const tempPath = await fileManager.downloadToTempFile(sessionId, fileId);
  try {
    return await fs.readFile(tempPath, "utf8");
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

export async function getMultiCssStyles(
  sessionId: string,
  fileIds: string[]
): Promise<MultiCssStylesResult> {
  if (fileIds.length === 0) {
    throw new ConversionError("No files provided");
  }

  const allFiles = await fileManager.getFilesByIds(sessionId, fileIds);
  const fileMap = new Map(allFiles.map(f => [f.id, f]));
  
  const cssFileIds: string[] = [];
  const htmlFileIds: string[] = [];
  
  for (const fileId of fileIds) {
    const file = fileMap.get(fileId);
    if (!file) {
      throw new ConversionError(`File not found: ${fileId}`);
    }
    if (isCssFile(file.originalName)) {
      cssFileIds.push(fileId);
    } else if (isHtmlFile(file.originalName)) {
      htmlFileIds.push(fileId);
    } else {
      throw new ConversionError(`Unsupported file type: ${file.originalName}`);
    }
  }

  const files: MultiFileInfo[] = [];
  let combinedCss = "";

  for (const fileId of cssFileIds) {
    const file = fileMap.get(fileId)!;
    files.push({ id: fileId, name: file.originalName, size: file.size });
    
    const css = await extractCssFromCssFile(sessionId, fileId);
    combinedCss = combinedCss ? mergeStylesheets(combinedCss, css, { priority: 'first' }) : css;
  }

  for (const fileId of htmlFileIds) {
    const file = fileMap.get(fileId)!;
    files.push({ id: fileId, name: file.originalName, size: file.size });
    
    const css = await extractCssFromHtmlFile(sessionId, fileId);
    combinedCss = combinedCss ? mergeStylesheets(combinedCss, css, { priority: 'first' }) : css;
  }

  const parsed = parseStylesheet(combinedCss);

  return { styles: combinedCss, parsed, files };
}
