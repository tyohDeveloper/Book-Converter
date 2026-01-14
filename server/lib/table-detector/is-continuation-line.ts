import { isKeyValueLineSimple } from "./is-key-value-line-simple";

export function isContinuationLine(line: string, expectedIndent: number): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;

  if (isKeyValueLineSimple(line)) {
    return false;
  }

  const firstCharPos = line.search(/\S/);

  if (firstCharPos === 0) {
    if (/^[A-Z][a-z]{2,19}$/.test(trimmed)) {
      return true;
    }

    const firstChar = trimmed.charAt(0);
    if (/[a-z\(\[\{\-\•\*\+\d]/.test(firstChar)) {
      return true;
    }

    if (trimmed.length < 30 && !/[.!?]$/.test(trimmed)) {
      return true;
    }

    return false;
  }

  const leadingSpaces = line.match(/^(\s+)/);
  if (leadingSpaces && leadingSpaces[1].length >= 2) {
    return true;
  }

  if (expectedIndent > 0 && firstCharPos >= expectedIndent - 3 && firstCharPos <= expectedIndent + 3) {
    return true;
  }

  return false;
}
