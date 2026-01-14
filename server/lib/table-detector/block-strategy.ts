import type { DetectedTable, BlockTableEntry } from "./types";
import { isDefinitionStyleEntry, parseBlockEntryToRow, isKeyValueLineSimple } from "./patterns";

function isBlockContinuation(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  if (isKeyValueLineSimple(line)) return false;
  if (isDefinitionStyleEntry(line)) return false;
  const leadingSpaces = line.match(/^(\s+)/);
  if (leadingSpaces && leadingSpaces[1].length >= 2) return true;
  const firstChar = trimmed.charAt(0);
  if (/^[a-z]/.test(trimmed)) return true;
  if (/^[\(\[\{]/.test(firstChar)) return true;
  return false;
}

export interface BlockStrategyState {
  inBlockTable: boolean;
  blockTableStart: number;
  blockTableEntries: BlockTableEntry[];
  pendingBlockEntry: string;
  lastNonEmptyLineNum: number;
}

export function createBlockState(): BlockStrategyState {
  return {
    inBlockTable: false,
    blockTableStart: 0,
    blockTableEntries: [],
    pendingBlockEntry: "",
    lastNonEmptyLineNum: 0,
  };
}

export function processBlockLine(
  line: string,
  lineNumber: number,
  state: BlockStrategyState
): { table: DetectedTable | null; consumed: boolean } {
  const trimmed = line.trim();

  if (isDefinitionStyleEntry(line)) {
    if (!state.inBlockTable) {
      state.inBlockTable = true;
      state.blockTableStart = lineNumber;
      state.blockTableEntries = [];
      state.pendingBlockEntry = "";
    }

    if (state.pendingBlockEntry.length > 0) {
      state.blockTableEntries.push({
        lineNum: state.lastNonEmptyLineNum,
        text: state.pendingBlockEntry.trim(),
      });
    }

    state.pendingBlockEntry = trimmed;
    state.lastNonEmptyLineNum = lineNumber;
    return { table: null, consumed: true };
  }

  if (state.inBlockTable && trimmed.length > 0 && state.pendingBlockEntry.length > 0) {
    if (isBlockContinuation(line)) {
      state.pendingBlockEntry += " " + trimmed;
      state.lastNonEmptyLineNum = lineNumber;
      return { table: null, consumed: true };
    }
  }

  if (state.inBlockTable && trimmed.length === 0) {
    return { table: null, consumed: true };
  }

  if (state.inBlockTable) {
    if (state.pendingBlockEntry.length > 0) {
      state.blockTableEntries.push({
        lineNum: state.lastNonEmptyLineNum,
        text: state.pendingBlockEntry.trim(),
      });
      state.pendingBlockEntry = "";
    }

    let table: DetectedTable | null = null;
    if (state.blockTableEntries.length >= 2) {
      const rows = state.blockTableEntries.map((e) => parseBlockEntryToRow(e.text));
      table = {
        startLine: state.blockTableStart,
        endLine: state.blockTableEntries[state.blockTableEntries.length - 1].lineNum,
        rows,
        headerRow: undefined,
        strategy: "block",
      };
    }
    state.inBlockTable = false;
    state.blockTableEntries = [];
    return { table, consumed: false };
  }

  return { table: null, consumed: false };
}

export function finalizeBlockTable(state: BlockStrategyState): DetectedTable | null {
  if (state.inBlockTable) {
    if (state.pendingBlockEntry.length > 0) {
      state.blockTableEntries.push({
        lineNum: state.lastNonEmptyLineNum,
        text: state.pendingBlockEntry.trim(),
      });
    }

    if (state.blockTableEntries.length >= 2) {
      const rows = state.blockTableEntries.map((e) => [e.text]);
      return {
        startLine: state.blockTableStart,
        endLine: state.blockTableEntries[state.blockTableEntries.length - 1].lineNum,
        rows,
        headerRow: undefined,
        strategy: "block",
      };
    }
  }
  return null;
}
