export function isHtmlFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.xhtml');
}
