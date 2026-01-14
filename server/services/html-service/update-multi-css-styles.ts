import fs from "fs/promises";
import { JSDOM } from "jsdom";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { sanitizeFilename } from "../../lib/file-manager/sanitize";
import { withTempFile } from "../../lib/file-manager/temp-file";
import { isHtmlFile } from "../../lib/file-manager/is-html-file";
import { isCssFile } from "../../lib/file-manager/is-css-file";
import { getTempFilePath } from "../../domain/paths";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { normalizeToXhtml } from "../../lib/xhtml/normalize-to-xhtml";
import { sortAndFormatCss } from "@shared/css/sort-and-format-css";
import { extractInstructions, removeAppliedInstructions } from "../../lib/css/extract-instructions";
import { applyInstructions } from "../../lib/css/apply-instructions";

const log = logger.child({ service: "html-css-multi" });

export interface UpdateMultiCssResult {
  files: ManagedFile[];
}

async function updateHtmlFile(
  sessionId: string,
  fileId: string,
  styles: string,
  instructions: ReturnType<typeof extractInstructions>
): Promise<ManagedFile> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file || !isHtmlFile(file.originalName)) {
    throw new ConversionError(`Invalid HTML file: ${fileId}`);
  }

  const tempPath = await fileManager.downloadToTempFile(sessionId, fileId);
  let content: string;
  try {
    content = await fs.readFile(tempPath, "utf8");
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }

  const isAlreadyFormatted = file.isOutput && file.originalName.includes("(formatted)");
  const dom = new JSDOM(content);
  const doc = dom.window.document;
  const head = doc.head;

  const allStyleEls = doc.querySelectorAll("style");
  for (let i = 1; i < allStyleEls.length; i++) {
    allStyleEls[i].remove();
  }
  
  let styleEl = doc.querySelector("head style");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    head.appendChild(styleEl);
  }
  styleEl.textContent = styles;

  let serialized = dom.serialize();
  
  for (const instr of instructions) {
    if (instr.type === 'delete' && instr.selector.startsWith('.')) {
      const className = instr.selector.slice(1);
      const classRegex = new RegExp(`\\bclass\\s*=\\s*"([^"]*\\b${className}\\b[^"]*)"`, 'gi');
      serialized = serialized.replace(classRegex, (match, classList) => {
        const newClasses = classList.split(/\s+/).filter((c: string) => c !== className).join(' ').trim();
        return newClasses ? `class="${newClasses}"` : '';
      });
    } else if (instr.type === 'replace' && instr.selector.startsWith('.') && instr.replacement?.startsWith('.')) {
      const oldClass = instr.selector.slice(1);
      const newClass = instr.replacement.slice(1);
      const classRegex = new RegExp(`\\bclass\\s*=\\s*"([^"]*\\b${oldClass}\\b[^"]*)"`, 'gi');
      serialized = serialized.replace(classRegex, (match, classList) => {
        const newClasses = classList.split(/\s+/).map((c: string) => c === oldClass ? newClass : c).join(' ');
        return `class="${newClasses}"`;
      });
    }
  }

  const cleanedHtml = removeAppliedInstructions(serialized, instructions);
  const outputHtml = normalizeToXhtml(cleanedHtml);
  const outputName = isAlreadyFormatted
    ? file.originalName
    : sanitizeFilename(
        file.originalName.replace(/\.(html?|xhtml)$/i, "").replace(/ \(formatted\)$/, "") +
        " (formatted).html"
      );

  const outputPath = getTempFilePath("html-css-multi", "html");
  const outputFile = await withTempFile(outputPath, async (p: string) => {
    await fs.writeFile(p, outputHtml, "utf8");
    return fileManager.addOutputFile(sessionId, outputName, p, "html");
  });

  if (isAlreadyFormatted) {
    try {
      await fileManager.deleteFile(sessionId, fileId);
    } catch (e) {
      log.warn("Failed to delete previous formatted version", { fileId, error: e });
    }
  }

  return outputFile;
}

async function updateCssFile(
  sessionId: string,
  fileId: string,
  styles: string
): Promise<ManagedFile> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file || !isCssFile(file.originalName)) {
    throw new ConversionError(`Invalid CSS file: ${fileId}`);
  }

  return fileManager.updateFileContent(sessionId, fileId, styles);
}

export async function updateMultiCssStyles(
  sessionId: string,
  fileIds: string[],
  styles: string
): Promise<UpdateMultiCssResult> {
  if (fileIds.length === 0) {
    throw new ConversionError("No files provided");
  }

  log.info("Updating CSS styles for multiple files", { count: fileIds.length });

  const instructions = extractInstructions(styles);
  const cssForFiles = instructions.length > 0 ? applyInstructions(styles, instructions) : styles;
  const formattedStyles = sortAndFormatCss(cssForFiles);
  
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

  const outputFiles: ManagedFile[] = [];

  for (const fileId of cssFileIds) {
    const outputFile = await updateCssFile(sessionId, fileId, formattedStyles);
    outputFiles.push(outputFile);
  }

  for (const fileId of htmlFileIds) {
    const outputFile = await updateHtmlFile(sessionId, fileId, formattedStyles, instructions);
    outputFiles.push(outputFile);
  }

  log.info("Multi-file CSS styles updated", { cssCount: cssFileIds.length, htmlCount: htmlFileIds.length });
  return { files: outputFiles };
}
