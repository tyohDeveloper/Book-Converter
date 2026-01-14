export function isHtmlFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.xhtml');
}
