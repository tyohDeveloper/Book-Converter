export function isSectionHeader(key: string, value: string): boolean {
  if (value && value.trim().length > 0) return false;
  return /^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(key.trim());
}
