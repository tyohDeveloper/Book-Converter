/**
 * Pipe-delimited table detection patterns
 */

export function isTableBorderLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;

  const borderChars = /^[\-\+\=\|\_\s]+$/;
  if (borderChars.test(trimmed) && trimmed.includes("-")) {
    return true;
  }

  if (/^\+[\-\+]+\+$/.test(trimmed)) return true;
  if (/^\|[\-\|]+\|$/.test(trimmed)) return true;
  if (/^[\-]+(\+[\-]+)+$/.test(trimmed)) return true;

  return false;
}

export function isTableDataLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;

  if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
    return true;
  }

  const pipeCount = (trimmed.match(/\|/g) || []).length;
  if (pipeCount >= 2) {
    if (/^\S+\s{3,}/.test(trimmed)) {
      return false;
    }
    const textSeparatorPattern = trimmed.match(/\s\|\s/g);
    if (textSeparatorPattern && textSeparatorPattern.length === pipeCount) {
      return false;
    }
    return true;
  }

  return false;
}

export function parseTableRow(line: string): string[] {
  const trimmed = line.trim();

  if (trimmed.startsWith("|")) {
    const cells = trimmed.split("|").slice(1, -1);
    return cells.map((c) => c.trim());
  }

  const cells = trimmed.split("|");
  return cells.map((c) => c.trim());
}
