import { buildXhtmlDocument as buildHtmlDocument } from "../../lib/html-builder/build-xhtml-document";
import { escapeHtml } from "../../domain/xml";
import { buildFileToc } from "./helpers";
import type { DocxFileContent, DocxConversionSettings } from "./types";

export interface CombinedHtmlOptions {
  fileContents: DocxFileContent[];
  firstFileName: string;
  settings: DocxConversionSettings;
}

export function buildCombinedHtml(options: CombinedHtmlOptions): { html: string; title: string } {
  const { fileContents, firstFileName, settings } = options;
  
  const title = settings.title || (fileContents.length > 1 ? "Combined Documents" : firstFileName);
  const includeTableOfContents = settings.includeTableOfContents !== false;
  
  const tocHtml = includeTableOfContents ? buildFileToc(fileContents) : "";
  const sectionsHtml = fileContents.map(fc => 
    `<section id="${fc.fileId}"><h2>${escapeHtml(fc.name)}</h2>\n${fc.html}</section>`
  ).join("\n\n");
  
  const bodyContent = tocHtml + sectionsHtml;
  const html = buildHtmlDocument(title, bodyContent);
  
  return { html, title };
}
