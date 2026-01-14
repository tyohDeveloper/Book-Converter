import { fixLigatures } from "./ligatures";
import { TextCleanupOptions } from "./types";

export function fixHyphenation(text: string): string {
  return text.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');
}

export function cleanWhitespace(text: string): string {
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let consecutiveEmpty = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed === '\f') {
      if (trimmed === '\f') {
        consecutiveEmpty = 0;
        cleanedLines.push('\f');
      } else {
        consecutiveEmpty++;
        if (consecutiveEmpty === 1) {
          cleanedLines.push('');
        }
      }
    } else {
      consecutiveEmpty = 0;
      cleanedLines.push(trimmed);
    }
  }
  return cleanedLines.join('\n');
}

export interface InMemoryCleanupOptions {
  fixLigatures?: boolean;
  fixHyphenation?: boolean;
  cleanWhitespace?: boolean;
}

export function cleanupText(text: string, options: InMemoryCleanupOptions): string {
  let result = text;
  
  if (options.fixLigatures) {
    result = fixLigatures(result);
  }
  
  if (options.fixHyphenation) {
    result = fixHyphenation(result);
  }
  
  if (options.cleanWhitespace) {
    result = cleanWhitespace(result);
  }
  
  return result;
}
