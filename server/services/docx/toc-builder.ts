import { JSDOM } from "jsdom";
import type { TocEntry as BaseTocEntry } from "@shared/toc/types";

export interface TocEntry extends BaseTocEntry {
  text: string;
  level: number;
}

export function extractHeadings(html: string): TocEntry[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const headings = doc.querySelectorAll("h1, h2");
  const entries: TocEntry[] = [];
  let idCounter = 0;

  headings.forEach((h) => {
    const text = h.textContent?.trim() || "";
    if (!text) return;

    let id = h.id;
    if (!id) {
      id = `toc-heading-${++idCounter}`;
      h.id = id;
    }

    const level = parseInt(h.tagName.substring(1), 10);
    entries.push({ id, text, label: text, level });
  });

  return entries;
}

export function addHeadingIds(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const headings = doc.querySelectorAll("h1, h2");
  let idCounter = 0;

  headings.forEach((h) => {
    if (!h.id && h.textContent?.trim()) {
      h.id = `toc-heading-${++idCounter}`;
    }
  });

  return doc.body.innerHTML;
}

export function buildTocHtml(entries: TocEntry[], documentTitle?: string): string {
  if (entries.length === 0) return "";

  const tocItems = entries
    .map((e) => {
      const indent = e.level === 2 ? 'style="margin-left: 1.5em;"' : "";
      return `<p ${indent}><a href="#${e.id}">${e.text}</a></p>`;
    })
    .join("\n");

  const titleHtml = documentTitle
    ? `<h1 style="text-align: center; margin-bottom: 2em;">${documentTitle}</h1>`
    : "";

  return `
${titleHtml}
<div style="page-break-after: always;">
  <h2>Table of Contents</h2>
  ${tocItems}
</div>
`;
}

export function injectTocIntoHtml(html: string, documentTitle?: string): string {
  const withIds = addHeadingIds(html);
  const entries = extractHeadings(withIds);
  
  if (entries.length < 2) {
    return withIds;
  }
  
  const tocHtml = buildTocHtml(entries, documentTitle);
  return tocHtml + withIds;
}
