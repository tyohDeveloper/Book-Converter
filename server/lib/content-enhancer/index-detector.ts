import type { IndexEntry } from './types';

export function detectIndexSection(lines: string[]): IndexEntry[] {
  const entries: IndexEntry[] = [];
  let inIndex = false;

  const indexHeaderPattern = /^index$/i;
  const indexEntryPattern = /^([A-Za-z][\w\s,'-]*?),?\s+(\d+(?:[,\s]+\d+)*)\s*$/;
  const subEntryPattern = /^\s{2,}([A-Za-z][\w\s,'-]*?),?\s+(\d+(?:[,\s]+\d+)*)\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (!inIndex && indexHeaderPattern.test(trimmed)) {
      inIndex = true;
      continue;
    }

    if (inIndex) {
      if (trimmed === '') continue;

      const subMatch = line.match(subEntryPattern);
      if (subMatch && entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        if (!lastEntry.subEntries) lastEntry.subEntries = [];
        lastEntry.subEntries.push({
          term: subMatch[1].trim(),
          pageRefs: subMatch[2].split(/[,\s]+/).filter(Boolean),
          lineNumber
        });
        continue;
      }

      const match = trimmed.match(indexEntryPattern);
      if (match) {
        entries.push({
          term: match[1].trim(),
          pageRefs: match[2].split(/[,\s]+/).filter(Boolean),
          lineNumber
        });
      }

      if (entries.length >= 1000) break;
    }
  }

  return entries;
}
