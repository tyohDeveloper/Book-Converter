const CHAPTER_HEADING_PATTERN = /^<(h[1-2])[^>]*>\s*chapter\s+/i;

export function contentStartsWithChapterHeading(html: string): boolean {
  const trimmed = html.trim();
  return CHAPTER_HEADING_PATTERN.test(trimmed);
}
