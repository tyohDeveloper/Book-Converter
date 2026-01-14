const ANY_HEADING_PATTERN = /^<h[1-2][^>]*>/i;

export function contentStartsWithAnyHeading(html: string): boolean {
  const trimmed = html.trim();
  return ANY_HEADING_PATTERN.test(trimmed);
}
