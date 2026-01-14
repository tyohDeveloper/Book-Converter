import { extractChapterTitle } from "./extract-chapter-title";

export function injectChapterHeading(filename: string, contentHtml: string): string {
  const chapterTitle = extractChapterTitle(filename);
  if (!chapterTitle) {
    return contentHtml;
  }
  return `<h1>${chapterTitle}</h1>\n${contentHtml}`;
}
