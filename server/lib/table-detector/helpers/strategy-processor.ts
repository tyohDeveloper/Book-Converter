import type { DetectedTable } from "../types";
import { createPipeState, processPipeLine, finalizePipeTable } from "../pipe-strategy";
import { createKvState, processKvLine, finalizeKvTable } from "../kv-strategy";
import { createBlockState, processBlockLine, finalizeBlockTable } from "../block-strategy";
import { createAlignedState, processAlignedLine, finalizeAlignedTable } from "../aligned-strategy";
import { addTableLineNumbers } from "./merge";

export interface StrategyStates {
  pipe: ReturnType<typeof createPipeState>;
  kv: ReturnType<typeof createKvState>;
  block: ReturnType<typeof createBlockState>;
  aligned: ReturnType<typeof createAlignedState>;
}

export function createStrategyStates(): StrategyStates {
  return {
    pipe: createPipeState(),
    kv: createKvState(),
    block: createBlockState(),
    aligned: createAlignedState(),
  };
}

export function processLineWithStrategies(
  line: string,
  lineNumber: number,
  states: StrategyStates,
  tables: DetectedTable[],
  tableLineNumbers: Set<number>
): void {
  const pipeResult = processPipeLine(line, lineNumber, states.pipe);
  if (pipeResult.table) {
    tables.push(pipeResult.table);
    addTableLineNumbers(pipeResult.table, tableLineNumbers);
  }
  if (pipeResult.consumed) return;

  const kvResult = processKvLine(line, lineNumber, states.kv);
  if (kvResult.table) {
    tables.push(kvResult.table);
    addTableLineNumbers(kvResult.table, tableLineNumbers);
  }
  if (kvResult.consumed) return;

  const blockResult = processBlockLine(line, lineNumber, states.block);
  if (blockResult.table) {
    tables.push(blockResult.table);
    addTableLineNumbers(blockResult.table, tableLineNumbers);
  }
  if (blockResult.consumed) return;

  const alignedTable = processAlignedLine(line, lineNumber, states.aligned);
  if (alignedTable) {
    tables.push(alignedTable);
    addTableLineNumbers(alignedTable, tableLineNumbers);
  }
}

export function finalizeAllStrategies(
  lineNumber: number,
  states: StrategyStates,
  tables: DetectedTable[],
  tableLineNumbers: Set<number>
): void {
  const finalPipe = finalizePipeTable(lineNumber, states.pipe);
  if (finalPipe) {
    tables.push(finalPipe);
    addTableLineNumbers(finalPipe, tableLineNumbers);
  }

  const finalAligned = finalizeAlignedTable(states.aligned);
  if (finalAligned) {
    tables.push(finalAligned);
    addTableLineNumbers(finalAligned, tableLineNumbers);
  }

  const finalKv = finalizeKvTable(states.kv);
  if (finalKv) {
    tables.push(finalKv);
    addTableLineNumbers(finalKv, tableLineNumbers);
  }

  const finalBlock = finalizeBlockTable(states.block);
  if (finalBlock) {
    tables.push(finalBlock);
    addTableLineNumbers(finalBlock, tableLineNumbers);
  }
}
