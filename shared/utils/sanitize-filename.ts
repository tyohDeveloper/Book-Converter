export type SanitizeMode = "display" | "url" | "chapter" | "header";

export interface SanitizeFilenameOptions {
  mode?: SanitizeMode;
  maxLength?: number;
}

function normalizeUnicode(name: string): string {
  return name
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, "") // curly double quotes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "") // curly single quotes
    .replace(/[\u2026]/g, "...") // ellipsis
    .replace(/[\u2014\u2013]/g, "-") // em/en dash
    .replace(/[\u00A0]/g, " "); // non-breaking space
}

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F\x7F-\x9F]/g;

const WINDOWS_RESERVED_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
]);

function isWindowsReservedName(name: string): boolean {
  const baseName = name.split(".")[0].toUpperCase();
  return WINDOWS_RESERVED_NAMES.has(baseName);
}

function handleReservedName(name: string, fallback: string): string {
  if (!name || isWindowsReservedName(name)) {
    return fallback;
  }
  return name;
}

export function sanitizeFilename(name: string, options: SanitizeFilenameOptions = {}): string {
  const { mode = "display", maxLength = 200 } = options;
  
  const normalized = normalizeUnicode(name);
  
  if (mode === "url") {
    const result = normalized.replace(/[^a-z0-9]/gi, "-").toLowerCase().substring(0, maxLength);
    return handleReservedName(result, "file");
  }
  
  if (mode === "chapter") {
    const result = normalized
      .replace(INVALID_CHARS, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim()
      .substring(0, maxLength) || "chapter";
    return handleReservedName(result, "chapter");
  }
  
  if (mode === "header") {
    const result = normalized
      .replace(INVALID_CHARS, "")
      .replace(/[^\x20-\x7E]/g, "_") // ASCII printable only for HTTP headers
      .replace(/\s+/g, " ")
      .replace(/^\.+/, "")
      .replace(/\.+$/, "")
      .trim()
      .substring(0, 80) || "file";
    return handleReservedName(result, "file");
  }
  
  const result = normalized
    .replace(INVALID_CHARS, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .trim()
    .substring(0, maxLength) || "file";
  return handleReservedName(result, "file");
}
