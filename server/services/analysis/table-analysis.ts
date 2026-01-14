export interface TableRow {
  key: string;
  value: string;
}

export function parseTableRows(text: string): TableRow[] {
  const lines = text.split("\n");
  const rows: TableRow[] = [];
  let currentKey = "";
  let currentValue = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const gapMatch = trimmed.match(/^(\S+(?:\s\S+)?)\s{3,}(.+)$/);
    if (gapMatch) {
      if (currentKey) {
        rows.push({ key: currentKey, value: currentValue.trim() });
      }
      currentKey = gapMatch[1];
      currentValue = gapMatch[2];
    } else if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(trimmed) && line.search(/\S/) === 0) {
      if (currentKey) {
        rows.push({ key: currentKey, value: currentValue.trim() });
      }
      currentKey = trimmed;
      currentValue = "";
    } else if (currentKey) {
      currentValue += (currentValue ? "\n" : "") + trimmed;
    }
  }

  if (currentKey) {
    rows.push({ key: currentKey, value: currentValue.trim() });
  }

  return rows;
}
