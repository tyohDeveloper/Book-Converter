import fs from "fs/promises";
import { JSDOM } from "jsdom";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { sanitizeFilename } from "../../lib/file-manager/sanitize";
import { withTempFile } from "../../lib/file-manager/temp-file";
import { isHtmlFile } from "../../lib/file-manager/is-html-file";
import { getTempFilePath } from "../../domain/paths";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { normalizeToXhtml } from "../../lib/xhtml/normalize-to-xhtml";
import { sortAndFormatCss } from "../../lib/css/sort-and-format-css";
import { extractInstructions, removeAppliedInstructions } from "../../lib/css/extract-instructions";

const log = logger.child({ service: "html-css" });

export interface UpdateCssResult {
  file: ManagedFile;
}

export async function updateCssStyles(
  sessionId: string,
  fileId: string,
  styles: string
): Promise<UpdateCssResult> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file || !isHtmlFile(file.originalName)) {
    throw new ConversionError("Invalid HTML file");
  }

  log.info("Updating CSS styles", { fileId });

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
  const formattedStyles = sortAndFormatCss(styles);
  styleEl.textContent = formattedStyles;

  const serialized = dom.serialize();
  const instructions = extractInstructions(serialized);
  const cleanedHtml = instructions.length > 0 ? removeAppliedInstructions(serialized, instructions) : serialized;
  const outputHtml = normalizeToXhtml(cleanedHtml);
  const outputName = isAlreadyFormatted
    ? file.originalName
    : sanitizeFilename(
        file.originalName.replace(/\.(html?|xhtml)$/i, "").replace(/ \(formatted\)$/, "") +
        " (formatted).html"
      );

  const outputPath = getTempFilePath("html-css", "html");
  const outputFile = await withTempFile(outputPath, async (p: string) => {
    await fs.writeFile(p, outputHtml, "utf8");
    return fileManager.addOutputFile(sessionId, outputName, p, "html");
  });

  if (isAlreadyFormatted) {
    try {
      await fileManager.deleteFile(sessionId, fileId);
      log.debug("Deleted previous formatted version", { fileId });
    } catch (e) {
      log.warn("Failed to delete previous formatted version", { fileId, error: e });
    }
  }

  log.info("CSS styles updated", { outputName });
  return { file: outputFile };
}
