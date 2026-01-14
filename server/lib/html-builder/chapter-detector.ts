import { isChapterHeading as domainIsChapterHeading, CHAPTER_PATTERNS_FLEXIBLE } from '../../domain/chapter';
import { escapeHtml } from '../../domain/xml';

export interface DetectedChapter {
  title: string;
  lineNumber: number;
  id: string;
}

export function isChapterHeading(line: string): boolean {
  return domainIsChapterHeading(line, CHAPTER_PATTERNS_FLEXIBLE);
}

export function detectChapters(text: string): DetectedChapter[] {
  const lines = text.split('\n');
  const chapters: DetectedChapter[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (isChapterHeading(line)) {
      const id = `chapter-${chapters.length + 1}`;
      chapters.push({
        title: line,
        lineNumber: i + 1,
        id
      });
    }
  }

  return chapters;
}

export function generateTocHtml(chapters: DetectedChapter[]): string {
  if (chapters.length === 0) return '';

  const tocEntries = chapters.map(ch =>
    `  <li><a href="#${ch.id}">${escapeHtml(ch.title)}</a></li>`
  ).join('\n');

  return `<nav class="table-of-contents">
  <h2>Table of Contents</h2>
  <ol>
${tocEntries}
  </ol>
</nav>`;
}
