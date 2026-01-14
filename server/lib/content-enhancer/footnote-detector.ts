import type { Footnote } from './types';

export function detectFootnotes(lines: string[]): Footnote[] {
  const footnotes: Footnote[] = [];
  let pendingFootnote: { id: number; marker: string; text: string; lineNumber: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const trimmed = lines[i].trim();

    if (/^\d{1,3}\s+[A-Z]/.test(trimmed) && trimmed.length > 20) {
      if (pendingFootnote) {
        footnotes.push(pendingFootnote);
      }

      const match = trimmed.match(/^(\d+)\s+(.+)/);
      if (match) {
        pendingFootnote = {
          id: parseInt(match[1], 10),
          marker: match[1],
          text: match[2].trim(),
          lineNumber
        };
      }
    } else if (pendingFootnote && trimmed && !/^\d{1,3}\s+[A-Z]/.test(trimmed)) {
      pendingFootnote.text += ' ' + trimmed;
    } else if (pendingFootnote && !trimmed) {
      footnotes.push(pendingFootnote);
      pendingFootnote = null;
    }

    if (footnotes.length >= 500) break;
  }

  if (pendingFootnote) {
    footnotes.push(pendingFootnote);
  }

  return footnotes;
}
