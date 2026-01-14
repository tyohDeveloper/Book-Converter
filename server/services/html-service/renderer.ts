import { generateTocHtml, detectChapters } from "../../lib/html-builder/chapter-detector";
import { renderContentToXhtml } from "../../lib/html-builder/content-renderer";
import { buildFileToc as buildFileTocBase, toTocEntries } from "../../lib/html-builder/toc-builder";
import { stripDuplicateHeadingFromPages } from "../../lib/text-utils/normalize";
import { shouldInjectChapterHeading } from "../../lib/text-utils/should-inject-chapter-heading";
import { injectChapterHeading } from "../../lib/text-utils/inject-chapter-heading";
import { tableToHTML } from "../../lib/table-detector/renderer";
import type { DetectedTable } from "../../lib/table-detector/types";
import { composeFragmentsToSections } from "./composer/compose-fragments-to-sections";
import type { ContentFragment } from "./composer/types";
import type { FileContent } from "./types";

function injectTablesIntoStyledHtml(styledHtml: string, tables: DetectedTable[]): string {
  if (tables.length === 0) return styledHtml;
  
  const tableHtml = tables.map(t => tableToHTML(t)).join("\n");
  return tableHtml + "\n" + styledHtml;
}

export function buildFileToc(fileContents: { name: string; fileId: string }[]): string {
  return buildFileTocBase(toTocEntries(fileContents));
}

function renderPagesToHtml(fc: FileContent): string {
  const filename = fc.name + ".pdf";
  
  let rawHtml = fc.pages.map(page => {
    if (page.styledHtml) {
      return injectTablesIntoStyledHtml(page.styledHtml, page.tables || []);
    }
    return renderContentToXhtml(page.text, { tables: page.tables, includeToc: false, wrapChapters: false });
  }).join("\n");
  
  const needsChapterHeading = shouldInjectChapterHeading(filename, rawHtml);
  
  const pages = stripDuplicateHeadingFromPages(fc.pages, fc.name);
  let html = pages.map(page => {
    if (page.styledHtml) {
      return injectTablesIntoStyledHtml(page.styledHtml, page.tables || []);
    }
    return renderContentToXhtml(page.text, { tables: page.tables, includeToc: false, wrapChapters: false });
  }).join("\n");
  
  if (needsChapterHeading) {
    html = injectChapterHeading(filename, html);
  }
  
  return html;
}

export function renderPageAwareToFragments(fileContents: FileContent[]): ContentFragment[] {
  return fileContents.map(fc => ({
    id: fc.fileId,
    name: fc.name,
    bodyHtml: renderPagesToHtml(fc),
  }));
}

export function renderPageAwareContent(fileContents: FileContent[], includeTableOfContents: boolean): string {
  const fragments = renderPageAwareToFragments(fileContents);
  return composeFragmentsToSections({ fragments, includeToc: includeTableOfContents });
}

export function renderSingleFileContent(fc: FileContent | ContentFragment, includeTableOfContents: boolean): string {
  if ("bodyHtml" in fc) {
    return fc.bodyHtml;
  }
  
  const filename = fc.name + ".pdf";
  const rawHtml = fc.pages.map(page => {
    if (page.styledHtml) {
      return injectTablesIntoStyledHtml(page.styledHtml, page.tables || []);
    }
    return renderContentToXhtml(page.text, { tables: page.tables, includeToc: false, wrapChapters: false });
  }).join("\n");
  const needsChapterHeading = shouldInjectChapterHeading(filename, rawHtml);
  
  const pages = stripDuplicateHeadingFromPages(fc.pages, fc.name);
  const combinedText = pages.map(p => p.text).join("\n");
  const chapters = detectChapters(combinedText);
  const chapterTocHtml = includeTableOfContents && chapters.length > 0 ? generateTocHtml(chapters) : "";

  const pageHtmlParts = pages.map(page => {
    if (page.styledHtml) {
      return injectTablesIntoStyledHtml(page.styledHtml, page.tables || []);
    }
    return renderContentToXhtml(page.text, { tables: page.tables, includeToc: false, chapters, wrapChapters: false });
  });
  
  let bodyHtml = pageHtmlParts.join("\n");
  if (needsChapterHeading) {
    bodyHtml = injectChapterHeading(filename, bodyHtml);
  }
  
  return `${chapterTocHtml}${bodyHtml}`;
}

export function renderSimpleContent(fragments: ContentFragment[], includeTableOfContents: boolean = true): string {
  return composeFragmentsToSections({ fragments, includeToc: includeTableOfContents });
}
