import type { DetectedTable } from "./types";
import { isTableBorderLine, isTableDataLine, parseTableRow } from "./patterns";

export interface PipeStrategyState {
  inPipeTable: boolean;
  pipeTableStart: number;
  currentRows: string[][];
  headerRowIndex: number | undefined;
}

export function createPipeState(): PipeStrategyState {
  return {
    inPipeTable: false,
    pipeTableStart: 0,
    currentRows: [],
    headerRowIndex: undefined,
  };
}

export function processPipeLine(
  line: string,
  lineNumber: number,
  state: PipeStrategyState
): { table: DetectedTable | null; consumed: boolean } {
  if (isTableDataLine(line)) {
    if (!state.inPipeTable) {
      state.inPipeTable = true;
      state.pipeTableStart = lineNumber;
      state.currentRows = [];
      state.headerRowIndex = undefined;
    }

    if (!isTableBorderLine(line)) {
      state.currentRows.push(parseTableRow(line));
    } else if (state.currentRows.length === 1) {
      state.headerRowIndex = 0;
    }

    return { table: null, consumed: true };
  }

  if (isTableBorderLine(line) && state.inPipeTable) {
    if (state.currentRows.length === 1) {
      state.headerRowIndex = 0;
    }
    return { table: null, consumed: true };
  }

  if (state.inPipeTable) {
    let table: DetectedTable | null = null;
    if (state.currentRows.length >= 2) {
      table = {
        startLine: state.pipeTableStart,
        endLine: lineNumber - 1,
        rows: state.currentRows,
        headerRow: state.headerRowIndex,
        strategy: "pipe",
      };
    }
    state.inPipeTable = false;
    state.currentRows = [];
    return { table, consumed: false };
  }

  return { table: null, consumed: false };
}

export function finalizePipeTable(
  lineNumber: number,
  state: PipeStrategyState
): DetectedTable | null {
  if (state.inPipeTable && state.currentRows.length >= 2) {
    return {
      startLine: state.pipeTableStart,
      endLine: lineNumber,
      rows: state.currentRows,
      headerRow: state.headerRowIndex,
      strategy: "pipe",
    };
  }
  return null;
}
