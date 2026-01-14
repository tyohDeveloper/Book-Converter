export type TableStrategy = "pipe" | "kv" | "block" | "aligned";

export interface DetectedTable {
  startLine: number;
  endLine: number;
  rows: string[][];
  headerRow?: number;
  strategy?: TableStrategy;
}

export interface TableDetectionResult {
  tables: DetectedTable[];
  tableLineNumbers: Set<number>;
}

export interface KeyValueResult {
  isKeyValue: boolean;
  key: string;
  value: string;
  keyEndCol: number;
  valueStartCol: number;
  isHeaderOnly: boolean;
}

export interface ColumnAlignment {
  isAligned: boolean;
  columns: number[];
}

export interface ParsedLine {
  lineNum: number;
  type: "key-value" | "section-header" | "continuation" | "end";
  key: string;
  value: string;
}

export interface TableRow {
  key: string;
  values: string[];
  isSection?: boolean;
}

export interface AlignedTableLine {
  lineNum: number;
  line: string;
  columns: number[];
}

export interface KvTableLine {
  lineNum: number;
  key: string;
  value: string;
}

export interface BlockTableEntry {
  lineNum: number;
  text: string;
}
