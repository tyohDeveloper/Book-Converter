import fs from "fs";
import readline from "readline";
import type { DetectedTable, TableDetectionResult } from "./types";
import { mergeTables } from "./helpers/merge";
import { mergeKvMultilineValues } from "./helpers/kv-merge";
import { createStrategyStates, processLineWithStrategies, finalizeAllStrategies } from "./helpers/strategy-processor";

function postProcessTables(tables: DetectedTable[]): DetectedTable[] {
  const merged = mergeTables(tables);
  return merged.map(mergeKvMultilineValues);
}

export async function detectTables(filePath: string): Promise<TableDetectionResult> {
  const tables: DetectedTable[] = [];
  const tableLineNumbers = new Set<number>();
  const states = createStrategyStates();

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: 64 * 1024 }),
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++;
    processLineWithStrategies(line, lineNumber, states, tables, tableLineNumbers);
  }

  finalizeAllStrategies(lineNumber, states, tables, tableLineNumbers);
  return { tables: postProcessTables(tables), tableLineNumbers };
}

export function detectTablesFromLines(lines: string[]): TableDetectionResult {
  const tables: DetectedTable[] = [];
  const tableLineNumbers = new Set<number>();
  const states = createStrategyStates();

  let lineNumber = 0;
  for (const line of lines) {
    lineNumber++;
    processLineWithStrategies(line, lineNumber, states, tables, tableLineNumbers);
  }

  finalizeAllStrategies(lineNumber, states, tables, tableLineNumbers);
  return { tables: postProcessTables(tables), tableLineNumbers };
}
