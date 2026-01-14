import { Router, Request, Response } from "express";
import path from "path";
import { fileManager } from "../../lib/file-manager/file-manager";
import { asyncHandler } from "../../common/errors/error-middleware";
import { FileNotFoundError, ValidationError } from "../../common/errors/specific-errors";
import { getSessionId, respond } from "../../common/http";
import { config } from "../../common/config";
import { sanitizeHtmlContent } from "../../lib/html-sanitizer";
import { downloadSingleFile, downloadBatchAsZip } from "../../services/batch-download-service";
import { sanitizeFilenameForHeader } from "@shared/utils/filenames";
import { logger } from "../../common/logger";

const log = logger.child({ service: "paste-html" });

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTitleFromHtml(html: string): string {
  const withoutStyle = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  // Check headings first (h1-h6)
  const headingMatch = withoutStyle.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (headingMatch) {
    const text = headingMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) return decodeHtmlEntities(text).substring(0, 100);
  }
  
  // Check first paragraph (only if reasonably short)
  const pMatch = withoutStyle.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (pMatch) {
    const text = pMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text && text.length < 100) return decodeHtmlEntities(text);
  }
  
  // Extract all text and use first line
  const textMatch = withoutStyle.replace(/<[^>]+>/g, " ").trim();
  if (textMatch) {
    const firstLine = textMatch.split(/[\n\r]+/)[0].trim();
    if (firstLine && firstLine.length < 100) return decodeHtmlEntities(firstLine);
    if (firstLine) return decodeHtmlEntities(firstLine.substring(0, 100));
  }
  
  // Fallback with timestamp
  return `pasted-${Date.now()}`;
}

export const batchRouter = Router();

function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

function removeGoogleDocsWrapper(html: string): string {
  // Google Docs wraps content in: <b id="docs-internal-guid-xxx" style="...">content</b>
  // This wrapper makes everything appear bold - we need to remove it
  // The wrapper can appear anywhere in the content, not just at the root
  
  log.debug("Checking for Google Docs wrapper");
  
  // Check if wrapper exists
  const hasWrapper = /id="docs-internal-guid[^"]*"/.test(html);
  log.debug("Has Google Docs wrapper:", { hasWrapper });
  
  if (!hasWrapper) {
    return html;
  }
  
  // Remove the bold wrapper while preserving its content
  // Match <b ...id="docs-internal-guid..."...> and its closing </b>
  const result = html.replace(
    /<b\s+[^>]*id="docs-internal-guid[^"]*"[^>]*>([\s\S]*?)<\/b>/gi,
    "$1"
  );
  
  log.debug("After wrapper removal, length changed:", { 
    before: html.length, 
    after: result.length,
    removed: html.length - result.length 
  });
  
  return result;
}

batchRouter.post(
  "/files/from-html",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { html, text, skipCss } = req.body;

    if (!html && !text) {
      throw new ValidationError("HTML or text content is required");
    }

    log.info("Processing pasted content", { hasHtml: !!html, hasText: !!text });

    // Step 1: Determine raw content - wrap plain text in <p> if no HTML
    let rawContent: string;
    if (html) {
      rawContent = html;
      log.debug("Using HTML content", { length: rawContent.length });
    } else {
      rawContent = `<p>${text}</p>`;
      log.debug("Wrapped plain text in <p>", { length: rawContent.length });
    }

    // Step 2: Extract body content if full HTML document
    let content = extractBodyContent(rawContent);
    log.debug("After body extraction", { length: content.length });

    // Step 3: Remove Google Docs wrapper BEFORE sanitization
    content = removeGoogleDocsWrapper(content);
    log.debug("After Google Docs wrapper removal", { length: content.length });
    log.debug("Content first 500 chars:", { preview: content.substring(0, 500) });

    // Step 4: Sanitize the content
    const { html: sanitizedHtml, css } = sanitizeHtmlContent(content, { skipCss: !!skipCss });
    log.debug("After sanitization", { length: sanitizedHtml.length, hasCss: !!css });
    log.debug("Sanitized first 500 chars:", { preview: sanitizedHtml.substring(0, 500) });
    
    const title = extractTitleFromHtml(sanitizedHtml);
    const safeName = sanitizeFilenameForHeader(title) || `pasted-${Date.now()}`;
    const htmlFilename = `${safeName}.html`;
    
    log.info("Creating file", { filename: htmlFilename, title });
    
    const { buildXhtml } = await import("../../lib/xhtml/build-xhtml");
    const xhtmlContent = buildXhtml({
      title: safeName,
      content: sanitizedHtml,
      styles: { inline: css ? [css] : [] },
      normalizeContent: true,
    });

    const tempPath = path.join(config.uploads.baseDir, `html-paste-${Date.now()}.html`);
    const fs = await import("fs/promises");
    await fs.writeFile(tempPath, xhtmlContent, "utf-8");

    try {
      const file = await fileManager.addOutputFile(sessionId, htmlFilename, tempPath, "html");
      // Return preview for client display
      const preview = sanitizedHtml.substring(0, 500);
      respond(res, { success: true, file, preview });
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  })
);

batchRouter.post(
  "/files/download-batch",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, stripTimestamps = false } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new ValidationError("No files selected for download");
    }

    const files = await fileManager.getFilesByIds(sessionId, fileIds);
    if (files.length === 0) {
      throw new FileNotFoundError("No valid files found");
    }

    if (files.length === 1) {
      await downloadSingleFile(sessionId, files[0], res, stripTimestamps);
      return;
    }

    await downloadBatchAsZip(sessionId, files, res, stripTimestamps);
  })
);
