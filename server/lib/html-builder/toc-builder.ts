import { escapeHtml, escapeXML } from '../../domain/xml';
import type { TocEntry } from '@shared/toc/types';

export type { TocEntry };

export function buildFileToc(entries: TocEntry[], useXmlEscape = false): string {
  if (entries.length <= 1) return "";
  const escape = useXmlEscape ? escapeXML : escapeHtml;
  let html = `<nav class="toc"><h2>Table of Contents</h2><ol>\n`;
  for (const entry of entries) {
    html += `  <li><a href="#${entry.id}">${escape(entry.label)}</a></li>\n`;
  }
  return html + `</ol></nav>\n`;
}

export function toTocEntry(item: { name?: string; title?: string; fileId?: string; id?: string }): TocEntry {
  return {
    label: item.name || item.title || '',
    id: item.fileId || item.id || '',
  };
}

export function toTocEntries<T extends { name?: string; title?: string; fileId?: string; id?: string }>(
  items: T[]
): TocEntry[] {
  return items.map(toTocEntry);
}
