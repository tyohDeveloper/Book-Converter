import { sanitizeFilename } from "./sanitize-filename";

export function sanitizeFilenameForDisplay(name: string, maxLength = 100): string {
  return sanitizeFilename(name, { mode: "display", maxLength }) || "untitled";
}
