/**
 * Block/definition style table detection patterns
 */

export function isDefinitionStyleEntry(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  if (/^[A-Z][a-z]{2,19}$/.test(trimmed)) return true;
  const match = trimmed.match(/^([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*){0,2}):\s+(.+)$/);
  if (match && match[1].length <= 30) return true;
  return false;
}

export function parseBlockEntryToRow(text: string): string[] {
  const match = text.match(/^([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*){0,2}):\s+([\s\S]+)$/);
  if (match && match[1].length <= 30) {
    return [match[1], match[2]];
  }
  return [text];
}
