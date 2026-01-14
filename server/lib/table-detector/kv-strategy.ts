import type { DetectedTable, KvTableLine } from "./types";
import { isKeyValueLine, isContinuationLine, isDefinitionStyleEntry } from "./patterns";

function isListStyleLine(line: string): boolean {
  const trimmed = line.trim();
  if (/^\[SR:/.test(trimmed)) return true;
  if (/Rune \[/.test(trimmed)) return true;
  return false;
}

function isDefinitionLine(line: string): boolean {
  const trimmed = line.trim();
  return /^[A-Z][a-zA-Z\s]+:/.test(trimmed) && trimmed.length > 20;
}

function isKeyOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 30) return false;
  return /^[A-Z][a-zA-Z\s]*$/.test(trimmed);
}

export interface KvStrategyState {
  inKvTable: boolean;
  kvTableStart: number;
  kvTableLines: KvTableLine[];
  valueColumnStart: number | undefined;
  lastNonEmptyLineNum: number;
}

export function createKvState(): KvStrategyState {
  return {
    inKvTable: false,
    kvTableStart: 0,
    kvTableLines: [],
    valueColumnStart: undefined,
    lastNonEmptyLineNum: 0,
  };
}

export function processKvLine(
  line: string,
  lineNumber: number,
  state: KvStrategyState
): { table: DetectedTable | null; consumed: boolean } {
  const trimmed = line.trim();
  
  const kv = isKeyValueLine(line, state.valueColumnStart);
  if (kv.isKeyValue) {
    if (!state.inKvTable) {
      state.inKvTable = true;
      state.kvTableStart = lineNumber;
      state.kvTableLines = [];
      state.valueColumnStart = kv.valueStartCol;
    }

    state.kvTableLines.push({ lineNum: lineNumber, key: kv.key, value: kv.value });
    state.lastNonEmptyLineNum = lineNumber;
    return { table: null, consumed: true };
  }

  if (state.inKvTable && trimmed.length > 0) {
    if (state.valueColumnStart !== undefined && isContinuationLine(line, state.valueColumnStart)) {
      state.kvTableLines.push({ lineNum: lineNumber, key: "", value: trimmed });
      state.lastNonEmptyLineNum = lineNumber;
      return { table: null, consumed: true };
    }
    
    if (isListStyleLine(line) || isDefinitionLine(line)) {
      state.kvTableLines.push({ lineNum: lineNumber, key: "", value: trimmed });
      state.lastNonEmptyLineNum = lineNumber;
      return { table: null, consumed: true };
    }
    
    if (isKeyOnlyLine(line)) {
      state.kvTableLines.push({ lineNum: lineNumber, key: trimmed, value: "" });
      state.lastNonEmptyLineNum = lineNumber;
      return { table: null, consumed: true };
    }
  }

  if (state.inKvTable && trimmed.length === 0) {
    return { table: null, consumed: true };
  }

  if (state.inKvTable) {
    let table: DetectedTable | null = null;
    if (state.kvTableLines.length >= 2) {
      const rawRows = state.kvTableLines
        .filter((l) => l.key || l.value)
        .map((l) => l.key && l.value ? [l.key, l.value] : [l.key || l.value]);
      table = {
        startLine: state.kvTableStart,
        endLine: state.kvTableLines[state.kvTableLines.length - 1].lineNum,
        rows: rawRows,
        headerRow: undefined,
        strategy: "kv",
      };
    }
    state.inKvTable = false;
    state.kvTableLines = [];
    state.valueColumnStart = undefined;
    return { table, consumed: false };
  }

  return { table: null, consumed: false };
}

export function finalizeKvTable(state: KvStrategyState): DetectedTable | null {
  if (state.inKvTable && state.kvTableLines.length >= 2) {
    const rawRows = state.kvTableLines
      .filter((l) => l.key || l.value)
      .map((l) => l.key && l.value ? [l.key, l.value] : [l.key || l.value]);
    return {
      startLine: state.kvTableStart,
      endLine: state.kvTableLines[state.kvTableLines.length - 1].lineNum,
      rows: rawRows,
      headerRow: undefined,
      strategy: "kv",
    };
  }
  return null;
}
