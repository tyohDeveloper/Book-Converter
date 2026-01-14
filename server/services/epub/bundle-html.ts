import fs from "fs";
import path from "path";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { extractBodyContent } from "../../lib/epub/parser";
import { escapeXML } from "../../domain/xml";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import { stripDuplicateFirstHtmlElement } from "../../lib/text-utils/normalize";
import { shouldInjectChapterHeading } from "../../lib/text-utils/should-inject-chapter-heading";
import { injectChapterHeading } from "../../lib/text-utils/inject-chapter-heading";
import { contentStartsWithAnyHeading } from "../../lib/text-utils/content-starts-with-any-heading";
import { unifyStyles } from "../../lib/css/unify-styles";
import type { BundleHtmlSettings } from "@shared/contracts/epub";

type BundleSettings = Partial<BundleHtmlSettings>;
import { isHtmlFile, sanitizeFilename, buildFileToc, buildHtmlDocument } from "./utils";

const log = logger.child({ service: "bundle-html" });

interface BundleResult {
  file: ManagedFile;
}

export async function bundleHtmlFiles(
  sessionId: string,
  fileIds: string[],
  settings: BundleSettings = {}
): Promise<BundleResult> {
  const tempFilePaths: string[] = [];

  try {
    const allFiles = await fileManager.getFilesByIds(sessionId, fileIds);
    const files = allFiles.filter(f => isHtmlFile(f.originalName));
    
    if (files.length === 0) {
      throw new ConversionError("No HTML/XHTML files selected");
    }

    const sections: { title: string; id: string; content: string }[] = [];
    const stylesByFile: { fileName: string; css: string }[] = [];

    for (const file of files) {
      log.info("Processing HTML file for bundling", { fileName: file.originalName });

      const tempFilePath = await fileManager.downloadToTempFile(sessionId, file.id);
      tempFilePaths.push(tempFilePath);
      
      const htmlContent = await fs.promises.readFile(tempFilePath, "utf-8");
      
      let bodyContent = extractBodyContent(htmlContent);
      const styleMatches = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleMatches && !settings.skipCss) {
        const fileCss: string[] = [];
        for (const styleTag of styleMatches) {
          const styleContent = styleTag.replace(/<\/?style[^>]*>/gi, "").trim();
          if (styleContent) {
            fileCss.push(styleContent);
          }
        }
        if (fileCss.length > 0) {
          stylesByFile.push({ fileName: file.originalName, css: fileCss.join('\n') });
        }
      }
      
      const baseName = file.originalName.replace(/\.(html|xhtml|htm)$/i, "");
      const needsChapterHeading = shouldInjectChapterHeading(file.originalName, bodyContent);
      bodyContent = stripDuplicateFirstHtmlElement(bodyContent, baseName);
      
      if (needsChapterHeading) {
        bodyContent = injectChapterHeading(file.originalName, bodyContent);
      } else if (!contentStartsWithAnyHeading(bodyContent)) {
        bodyContent = `<h1>${escapeXML(baseName)}</h1>\n${bodyContent}`;
      }
      
      const sectionId = `section-${file.id}`.replace(/[^a-z0-9-]/gi, "-");
      
      sections.push({
        title: baseName,
        id: sectionId,
        content: bodyContent,
      });
    }

    const title = settings.title || (files.length > 1 ? "Bundled Documents" : sections[0]?.title || "Document");
    const includeTableOfContents = settings.includeTableOfContents !== false;
    const skipCss = settings.skipCss || false;
    
    const tocHtml = includeTableOfContents ? buildFileToc(sections) : "";
    const sectionsHtml = sections.map(sec => 
      `<section id="${sec.id}">\n${sec.content}</section>`
    ).join("\n\n");
    
    const bodyContent = tocHtml + sectionsHtml;
    const unifiedCss = skipCss ? "" : unifyStyles(stylesByFile);
    const stylesToUse = unifiedCss ? [unifiedCss] : [];
    const fullHtml = buildHtmlDocument(title, bodyContent, stylesToUse, skipCss);

    const htmlTempPath = path.join(config.uploads.baseDir, `bundled-${Date.now()}.html`);
    await fs.promises.writeFile(htmlTempPath, fullHtml, "utf-8");

    const htmlFileName = `${sanitizeFilename(title)}.html`;
    const outputFile = await fileManager.addOutputFile(sessionId, htmlFileName, htmlTempPath, "html");

    await fs.promises.unlink(htmlTempPath).catch(() => {});
    log.info("Bundled HTML saved", { fileName: htmlFileName, fileId: outputFile.id, fileCount: files.length });

    return { file: outputFile };
  } finally {
    for (const tempPath of tempFilePaths) {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  }
}
