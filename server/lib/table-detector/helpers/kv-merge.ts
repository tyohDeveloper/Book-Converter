import type { DetectedTable } from "../types";

function isKeyOnlyRow(row: string[]): boolean {
  if (row.length !== 1) return false;
  const text = row[0].trim();
  if (text.length === 0 || text.length > 30) return false;
  return /^[A-Z][a-zA-Z\s]*$/.test(text);
}

function isListItemRow(row: string[]): boolean {
  if (row.length !== 1) return false;
  const text = row[0].trim();
  if (!text.length) return false;
  return /^\[SR:/.test(text) || /^\[.*Rune.*\]$/.test(text) || /Rune \[/.test(text);
}

function isDefinitionRow(row: string[]): boolean {
  if (row.length !== 1) return false;
  const text = row[0].trim();
  return /^[A-Z][a-zA-Z\s]+:/.test(text) && text.length > 20;
}

function isContinuationText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && /^[a-z]/.test(trimmed);
}

function mergeContinuationRows(rows: string[][]): string[][] {
  const result: string[][] = [];
  for (const row of rows) {
    if (row.length === 1 && isContinuationText(row[0]) && result.length > 0) {
      const prev = result[result.length - 1];
      if (prev.length === 1) {
        prev[0] = prev[0] + " " + row[0].trim();
      } else if (prev.length === 2) {
        prev[1] = prev[1] + " " + row[0].trim();
      }
    } else {
      result.push([...row]);
    }
  }
  return result;
}

export function mergeKvMultilineValues(table: DetectedTable): DetectedTable {
  if (table.strategy !== "kv") return table;

  const rows = mergeContinuationRows(table.rows);
  const result: string[][] = [];
  let i = 0;

  while (i < rows.length) {
    const row = rows[i];

    if (row.length === 2) {
      result.push(row);
      i++;
      continue;
    }

    if (isKeyOnlyRow(row)) {
      const key = row[0];
      const values: string[] = [];
      const firstBelow = rows[i + 1];
      const collectDefs = firstBelow && isDefinitionRow(firstBelow);
      const collectList = firstBelow && isListItemRow(firstBelow);

      let j = result.length - 1;
      while (j >= 0 && result[j].length === 1 && !isKeyOnlyRow(result[j])) {
        if (collectDefs && isDefinitionRow(result[j])) {
          values.unshift(result[j][0]);
          j--;
        } else if (collectList && isListItemRow(result[j])) {
          values.unshift(result[j][0]);
          j--;
        } else break;
      }

      const removeCount = result.length - 1 - j;
      for (let k = 0; k < removeCount; k++) result.pop();

      i++;
      while (i < rows.length && rows[i].length === 1 && !isKeyOnlyRow(rows[i])) {
        if (collectDefs && isDefinitionRow(rows[i])) {
          values.push(rows[i][0]);
          i++;
        } else if (collectList && isListItemRow(rows[i])) {
          values.push(rows[i][0]);
          i++;
        } else break;
      }

      result.push(values.length > 0 ? [key, values.join("<br />")] : row);
      continue;
    }

    result.push(row);
    i++;
  }

  return { ...table, rows: result };
}
