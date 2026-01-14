import { stripFileExtension } from "./strip-file-extension";

const CHAPTER_FILENAME_PATTERN = /^chapter\s+(\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\w+)$/i;

export function extractChapterTitle(filename: string): string | null {
  const baseName = stripFileExtension(filename);
  if (CHAPTER_FILENAME_PATTERN.test(baseName)) {
    return baseName;
  }
  return null;
}
