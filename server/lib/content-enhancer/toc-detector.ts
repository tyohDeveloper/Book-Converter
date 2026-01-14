import type { TOCEntry } from './types';

export function detectTableOfContents(lines: string[]): TOCEntry[] {
  const entries: TOCEntry[] = [];
  let inTOC = false;
  let tocStartLine = -1;

  const tocHeaderPattern = /^(contents|table\s+of\s+contents)$/i;
  const tocEntryPattern = /^(\s*)(.+?)\s*\.{2,}\s*(\d+|[ivxlcdm]+)\s*$/i;
  const numberedTocPattern = /^(\s*)(\d+(?:\.\d+)*)\s+(.+?)\s*\.{2,}\s*(\d+|[ivxlcdm]+)\s*$/i;
  const sectionPattern = /^(\s*)((?:Chapter|Part|Section|Book)\s+[\dIVXLCDM]+[:\s]*.*?)\s*\.{2,}\s*(\d+|[ivxlcdm]+)\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (tocHeaderPattern.test(trimmed)) {
      inTOC = true;
      tocStartLine = lineNumber;
      continue;
    }

    if (inTOC) {
      if (trimmed === '' && entries.length > 5) {
        break;
      }

      const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
      const level = Math.floor(leadingSpaces / 2) + 1;

      let match = trimmed.match(numberedTocPattern);
      if (match) {
        const numberParts = match[2].split('.').length;
        entries.push({
          title: `${match[2]} ${match[3]}`.trim(),
          level: numberParts,
          pageRef: match[4],
          lineNumber
        });
        continue;
      }

      match = trimmed.match(sectionPattern);
      if (match) {
        entries.push({
          title: match[2].trim(),
          level: Math.min(level, 3),
          pageRef: match[3],
          lineNumber
        });
        continue;
      }

      match = trimmed.match(tocEntryPattern);
      if (match) {
        entries.push({
          title: match[2].trim(),
          level: Math.min(level, 4),
          pageRef: match[3],
          lineNumber
        });
      }
    }

    if (lineNumber > 500 && !inTOC) break;
    if (inTOC && lineNumber - tocStartLine > 200) break;
  }

  return entries;
}
