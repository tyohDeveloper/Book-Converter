import type { DetectedTable } from "../types";

export function addTableLineNumbers(table: DetectedTable, lineNumbers: Set<number>): void {
  for (let i = table.startLine; i <= table.endLine; i++) {
    lineNumbers.add(i);
  }
}

export function mergeTables(tables: DetectedTable[]): DetectedTable[] {
  if (tables.length <= 1) return tables;
  tables.sort((a, b) => a.startLine - b.startLine);

  const merged: DetectedTable[] = [];
  let current = tables[0];

  for (let i = 1; i < tables.length; i++) {
    const next = tables[i];
    const gap = next.startLine - current.endLine;
    if (gap <= 2 && current.strategy === next.strategy) {
      current = {
        startLine: current.startLine,
        endLine: next.endLine,
        rows: [...current.rows, ...next.rows],
        headerRow: current.headerRow,
        strategy: current.strategy,
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  return merged;
}
