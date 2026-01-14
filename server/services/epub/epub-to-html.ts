import fs from "fs";
import path from "path";
import { fileManager } from "../../lib/file-manager/file-manager";
import { parseEpub, extractBodyContent } from "../../lib/epub/parser";
import { escapeXML } from "../../domain/xml";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import type { EpubToHtmlSettings, EpubConversionResult, ChapterData } from "./types";
import { 
  isEpubFile, 
  sanitizeFilename, 
  buildHtmlDocument, 
  buildFileToc,
  rewriteInternalLinks 
} from "./utils";

const log = logger.child({ service: "epub" });

export async function convertEpubToHtml(
  sessionId: string,
  fileIds: string[],
  settings: EpubToHtmlSettings = {}
): Promise<EpubConversionResult> {
  const tempFilePaths: string[] = [];

  try {
    const allFiles = await fileManager.getFilesByIds(sessionId, fileIds);
    const files = allFiles.filter(f => isEpubFile(f.originalName));
    
    if (files.length === 0) {
      throw new ConversionError("No EPUB files selected");
    }

    const allChapters: ChapterData[] = [];
    const allStyles: string[] = [];
    let firstTitle = "";

    for (const file of files) {
      log.info("Converting EPUB to HTML", { fileName: file.originalName });

      const tempFilePath = await fileManager.downloadToTempFile(sessionId, file.id);
      tempFilePaths.push(tempFilePath);
      
      const parsed = await parseEpub(tempFilePath);
      
      if (!firstTitle) {
        firstTitle = parsed.metadata.title || file.originalName.replace(/\.epub$/i, "");
      }
      
      for (const stylesheet of parsed.stylesheets) {
        allStyles.push(stylesheet.content);
      }
      
      const hrefToId = buildHrefMap(parsed.chapters, file.id);
      
      for (const chapter of parsed.chapters) {
        let bodyContent = extractBodyContent(chapter.content);
        const chapterId = `chapter-${file.id}-${chapter.id}`.replace(/[^a-z0-9-]/gi, "-");
        
        bodyContent = rewriteInternalLinks(bodyContent, hrefToId);
        
        allChapters.push({
          title: chapter.title,
          id: chapterId,
          content: bodyContent,
        });
      }
    }

    const title = settings.title || (files.length > 1 ? "Combined Documents" : firstTitle);
    const includeTableOfContents = settings.includeTableOfContents !== false;
    const skipCss = settings.skipCss || false;
    
    const tocHtml = includeTableOfContents ? buildFileToc(allChapters) : "";
    const sectionsHtml = allChapters.map(ch => 
      `<section id="${ch.id}"><h2>${escapeXML(ch.title)}</h2>\n${ch.content}</section>`
    ).join("\n\n");
    
    const bodyContent = tocHtml + sectionsHtml;
    const stylesToUse = skipCss ? [] : allStyles;
    const fullHtml = buildHtmlDocument(title, bodyContent, stylesToUse, skipCss);

    const htmlTempPath = path.join(config.uploads.baseDir, `epub-html-${Date.now()}.html`);
    await fs.promises.writeFile(htmlTempPath, fullHtml, "utf-8");

    const htmlFileName = `${sanitizeFilename(title)}.html`;
    const outputFile = await fileManager.addOutputFile(sessionId, htmlFileName, htmlTempPath, "html");

    await fs.promises.unlink(htmlTempPath).catch(() => {});
    log.info("HTML saved from EPUB", { fileName: htmlFileName, fileId: outputFile.id, fileCount: files.length });

    return { file: outputFile };
  } finally {
    for (const tempPath of tempFilePaths) {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  }
}

function buildHrefMap(
  chapters: { id: string; href: string }[], 
  fileId: string
): Map<string, string> {
  const hrefToId = new Map<string, string>();
  for (const chapter of chapters) {
    const chapterId = `chapter-${fileId}-${chapter.id}`.replace(/[^a-z0-9-]/gi, "-");
    hrefToId.set(chapter.href, chapterId);
    const baseName = chapter.href.split('/').pop() || chapter.href;
    hrefToId.set(baseName, chapterId);
  }
  return hrefToId;
}
