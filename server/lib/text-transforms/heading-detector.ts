export function isLikelyHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length > 80) return false;
  if (/^(chapter|part|section|prologue|epilogue|introduction|conclusion)\s/i.test(trimmed)) return true;
  if (/^(chapter|part|section)\s*\d+/i.test(trimmed)) return true;
  if (/\b(chapter|part)\s+\d+$/i.test(trimmed)) return true;
  if (/^[IVXLCDM]+\.\s/.test(trimmed)) return true;
  if (/^\d+\.\s+[A-Z]/.test(trimmed)) return true;
  if (/^[A-Z][A-Z\s\d]+$/.test(trimmed) && trimmed.length < 60) return true;
  return false;
}
