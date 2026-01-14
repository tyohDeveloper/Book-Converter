import { detectTablesFromLines } from "./detector";
import type { DetectedTable } from "./types";

export interface TableProcessingResult {
  text: string;
  tables: DetectedTable[];
  protectedLines?: Set<number>;
}

export function detectAndProtectTables(
  text: string,
  mergeParagraphsFn?: (text: string, sensitivity: number, protectedLines?: Set<number>) => string,
  sensitivity: number = 50
): TableProcessingResult {
  const lines = text.split('\n');
  const tableResult = detectTablesFromLines(lines);
  
  const protectedLines = tableResult.tableLineNumbers && tableResult.tableLineNumbers.size > 0
    ? tableResult.tableLineNumbers
    : undefined;
  
  if (mergeParagraphsFn) {
    const mergedText = mergeParagraphsFn(text, sensitivity, protectedLines);
    const mergedLines = mergedText.split('\n');
    const finalTableResult = detectTablesFromLines(mergedLines);
    
    return {
      text: mergedText,
      tables: finalTableResult.tables,
      protectedLines,
    };
  }
  
  return {
    text,
    tables: tableResult.tables,
    protectedLines,
  };
}
