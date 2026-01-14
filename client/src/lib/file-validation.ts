export const SUPPORTED_TYPES = [
  ".pdf", "application/pdf",
  ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".epub", "application/epub+zip",
  ".html", "text/html",
  ".htm",
  ".xhtml", "application/xhtml+xml",
  ".css", "text/css"
];

export function isValidFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === "application/pdf" 
    || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || file.type === "application/epub+zip"
    || file.type === "text/html"
    || file.type === "application/xhtml+xml"
    || file.type === "text/css"
    || name.endsWith('.pdf')
    || name.endsWith('.docx')
    || name.endsWith('.epub')
    || name.endsWith('.html')
    || name.endsWith('.htm')
    || name.endsWith('.xhtml')
    || name.endsWith('.css');
}
