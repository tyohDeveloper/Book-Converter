import fs from "fs/promises";
import { JSDOM } from "jsdom";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { sanitizeFilename } from "../../lib/file-manager/sanitize";
import { withTempFile } from "../../lib/file-manager/temp-file";
import { isHtmlFile } from "../../lib/file-manager/is-html-file";
import { getTempFilePath } from "../../domain/paths";
import { ConversionError } from "../../common/errors/specific-errors";
import { normalizeToXhtml } from "../../lib/xhtml/normalize-to-xhtml";
import { logger } from "../../common/logger";

const log = logger.child({ service: "html-pipeline" });

export interface LoadedHtmlDocument {
  file: ManagedFile;
  dom: JSDOM;
  doc: Document;
  head: HTMLHeadElement;
  body: HTMLElement;
  isAlreadyFormatted: boolean;
}

export async function loadHtmlDocument(
  sessionId: string,
  fileId: string
): Promise<LoadedHtmlDocument> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file || !isHtmlFile(file.originalName)) {
    throw new ConversionError("Invalid HTML file");
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

  return {
    file,
    dom,
    doc,
    head: doc.head,
    body: doc.body,
    isAlreadyFormatted,
  };
}

export interface SaveFormattedOutputOptions {
  sessionId: string;
  fileId: string;
  dom: JSDOM;
  originalName: string;
  isAlreadyFormatted: boolean;
  normalize?: boolean;
  prefix?: string;
}

export async function saveFormattedOutput(
  options: SaveFormattedOutputOptions
): Promise<ManagedFile> {
  const {
    sessionId,
    fileId,
    dom,
    originalName,
    isAlreadyFormatted,
    normalize = true,
    prefix = "html-format",
  } = options;

  const serialized = dom.serialize();
  const outputHtml = normalize ? normalizeToXhtml(serialized) : serialized;

  const outputName = isAlreadyFormatted
    ? originalName
    : sanitizeFilename(
        originalName.replace(/\.(html?|xhtml)$/i, "").replace(/ \(formatted\)$/, "") +
        " (formatted).html"
      );

  const outputPath = getTempFilePath(prefix, "html");
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

  return outputFile;
}

export function getOrCreateStyleElement(doc: Document, head: HTMLHeadElement): HTMLStyleElement {
  let styleEl = head.querySelector("style") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = doc.createElement("style");
    head.appendChild(styleEl);
  }
  return styleEl;
}
