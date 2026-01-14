import { sanitizeFilename } from "./sanitize-filename";

export function sanitizeFilenameForHeader(name: string): string {
  return sanitizeFilename(name, { mode: "header", maxLength: 80 });
}
