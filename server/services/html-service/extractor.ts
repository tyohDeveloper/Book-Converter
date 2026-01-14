import { fileManager } from "../../lib/file-manager/file-manager";
import { pagesToParagraphs } from "../../lib/html-builder/pages-to-paragraphs";
import { ConversionError } from "../../common/errors/specific-errors";
import { preparePdfForHtmlPageAware } from "../pipelines/text-prep";
import { extractPlainText } from "../pdf-plain-extractor";
import { extractStyledText } from "../pdf-styled-extractor/extractor";
import { styledLinesToHtml } from "../pdf-styled-extractor/lines-to-html";
import { stripDuplicateFirstHtmlElement } from "../../lib/text-utils/normalize";
import { shouldInjectChapterHeading } from "../../lib/text-utils/should-inject-chapter-heading";
import { injectChapterHeading } from "../../lib/text-utils/inject-chapter-heading";
import { createFragmentId } from "./composer/create-fragment-id";
import type { ContentFragment } from "./composer/types";
import type { HtmlConversionSettings, FileContent } from "./types";

export async function extractFilesContent(
  sessionId: string,
  fileIds: string[],
  settings: HtmlConversionSettings,
  tempFiles: string[]
): Promise<{ simple: ContentFragment[] } | { pageAware: FileContent[] }> {
  const allFiles = await fileManager.getFilesByIds(sessionId, fileIds);
  const files = allFiles.filter((f) => f.originalName.toLowerCase().endsWith(".pdf"));

  if (files.length === 0) {
    throw new ConversionError("No PDF files selected");
  }

  if (settings.simpleExtraction) {
    const contents: ContentFragment[] = [];
    for (const file of files) {
      const pdfTempPath = await fileManager.downloadToTempFile(sessionId, file.id);
      tempFiles.push(pdfTempPath);

      const fileTitle = file.originalName.replace(/\.pdf$/i, "");
      const fileAnchor = createFragmentId(file.id);
      
      let contentHtml: string;
      if (settings.preserveStyles) {
        const styledResult = await extractStyledText(pdfTempPath);
        const allLines = styledResult.pages.flatMap(p => p.lines);
        contentHtml = styledLinesToHtml(allLines);
      } else {
        const result = await extractPlainText(pdfTempPath);
        contentHtml = pagesToParagraphs(result.pages);
      }
      
      const needsChapterHeading = shouldInjectChapterHeading(file.originalName, contentHtml);
      contentHtml = stripDuplicateFirstHtmlElement(contentHtml, fileTitle);
      
      if (needsChapterHeading) {
        contentHtml = injectChapterHeading(file.originalName, contentHtml);
      }
      
      contents.push({
        id: fileAnchor,
        name: fileTitle,
        bodyHtml: contentHtml,
      });
    }
    return { simple: contents };
  }

  const contents: FileContent[] = [];
  for (const file of files) {
    const pdfTempPath = await fileManager.downloadToTempFile(sessionId, file.id);
    tempFiles.push(pdfTempPath);

    const prepared = await preparePdfForHtmlPageAware(pdfTempPath, settings, true);
    tempFiles.push(...prepared.tempFiles);

    contents.push({
      name: file.originalName.replace(/\.pdf$/i, ""),
      fileId: `file-${file.id.replace(/[^a-z0-9]/gi, "-")}`,
      pages: prepared.pages,
    });
  }
  return { pageAware: contents };
}

export async function extractSingleFileContent(
  sessionId: string,
  fileId: string,
  settings: HtmlConversionSettings,
  tempFiles: string[]
): Promise<FileContent | ContentFragment> {
  const allFiles = await fileManager.getFilesByIds(sessionId, [fileId]);
  const file = allFiles.find((f) => f.originalName.toLowerCase().endsWith(".pdf"));

  if (!file) {
    throw new ConversionError("PDF file not found");
  }

  const pdfTempPath = await fileManager.downloadToTempFile(sessionId, file.id);
  tempFiles.push(pdfTempPath);

  if (settings.simpleExtraction) {
    const fileTitle = file.originalName.replace(/\.pdf$/i, "");
    const fileAnchor = createFragmentId(file.id);
    
    let contentHtml: string;
    if (settings.preserveStyles) {
      const styledResult = await extractStyledText(pdfTempPath);
      const allLines = styledResult.pages.flatMap(p => p.lines);
      contentHtml = styledLinesToHtml(allLines);
    } else {
      const result = await extractPlainText(pdfTempPath);
      contentHtml = pagesToParagraphs(result.pages);
    }
    
    const needsChapterHeading = shouldInjectChapterHeading(file.originalName, contentHtml);
    contentHtml = stripDuplicateFirstHtmlElement(contentHtml, fileTitle);
    
    if (needsChapterHeading) {
      contentHtml = injectChapterHeading(file.originalName, contentHtml);
    }
    
    return {
      id: fileAnchor,
      name: fileTitle,
      bodyHtml: contentHtml,
    };
  }

  const prepared = await preparePdfForHtmlPageAware(pdfTempPath, settings, true);
  tempFiles.push(...prepared.tempFiles);

  return {
    name: file.originalName.replace(/\.pdf$/i, ""),
    fileId: createFragmentId(file.id),
    pages: prepared.pages,
  };
}
