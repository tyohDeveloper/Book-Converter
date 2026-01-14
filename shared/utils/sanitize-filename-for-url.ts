import { sanitizeFilename } from "./sanitize-filename";

export function sanitizeFilenameForUrl(name: string): string {
  return sanitizeFilename(name, { mode: "url" });
}
