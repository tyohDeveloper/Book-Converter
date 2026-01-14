export function isTableSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  return /^[A-Z][a-z]{2,19}$/.test(trimmed);
}
