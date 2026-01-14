import type { DetectedTable, AlignedTableLine } from "./types";
import { isAlignedColumnLine } from "./patterns";

export interface AlignedStrategyState {
  alignedTableLines: AlignedTableLine[];
}

export function createAlignedState(): AlignedStrategyState {
  return {
    alignedTableLines: [],
  };
}

export function processAlignedLine(
  line: string,
  lineNumber: number,
  state: AlignedStrategyState
): DetectedTable | null {
  const trimmed = line.trim();
  const aligned = isAlignedColumnLine(line, state.alignedTableLines[0]?.columns);

  if (aligned.isAligned && trimmed.length > 0) {
    state.alignedTableLines.push({ lineNum: lineNumber, line, columns: aligned.columns });
    return null;
  }

  if (state.alignedTableLines.length >= 3) {
    const rows = state.alignedTableLines.map((l) => {
      const words = l.line.match(/\S+/g) || [];
      return words;
    });

    const table: DetectedTable = {
      startLine: state.alignedTableLines[0].lineNum,
      endLine: state.alignedTableLines[state.alignedTableLines.length - 1].lineNum,
      rows,
      headerRow: 0,
      strategy: "aligned",
    };
    state.alignedTableLines = [];
    return table;
  }

  state.alignedTableLines = [];
  return null;
}

export function finalizeAlignedTable(state: AlignedStrategyState): DetectedTable | null {
  if (state.alignedTableLines.length >= 3) {
    const rows = state.alignedTableLines.map((l) => l.line.match(/\S+/g) || []);
    return {
      startLine: state.alignedTableLines[0].lineNum,
      endLine: state.alignedTableLines[state.alignedTableLines.length - 1].lineNum,
      rows,
      headerRow: 0,
      strategy: "aligned",
    };
  }
  return null;
}
