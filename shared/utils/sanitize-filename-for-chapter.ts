import { sanitizeFilename } from "./sanitize-filename";

export function sanitizeFilenameForChapter(name: string): string {
  return sanitizeFilename(name, { mode: "chapter" });
}
