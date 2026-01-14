import type { DetectedTable } from '../table-detector/types';

export interface TableLineInfo {
  tableStartLines: Map<number, DetectedTable>;
  tableLines: Set<number>;
}

export function buildTableLineMap(tables: DetectedTable[]): TableLineInfo {
  const tableStartLines = new Map<number, DetectedTable>();
  const tableLines = new Set<number>();

  for (const table of tables) {
    tableStartLines.set(table.startLine, table);
    for (let i = table.startLine; i <= table.endLine; i++) {
      tableLines.add(i);
    }
  }

  return { tableStartLines, tableLines };
}
