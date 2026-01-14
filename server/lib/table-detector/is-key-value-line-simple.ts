export function isKeyValueLineSimple(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  return /^\S+(?:\s\S+)?\s{3,}/.test(trimmed);
}
