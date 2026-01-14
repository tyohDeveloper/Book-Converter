import type { KvTableLine, TableRow } from "./types";
import { isSectionHeader } from "./is-section-header";
import { getSectionContentType, getSectionHeaderType } from "./section-content-type";

export function mergeKvTableRows(kvLines: KvTableLine[]): string[][] {
  interface ParsedLine {
    lineNum: number;
    type: "key-value" | "section-header" | "continuation";
    key: string;
    value: string;
  }

  const parsedLines: ParsedLine[] = [];

  for (const line of kvLines) {
    if (line.key) {
      const isHeader = isSectionHeader(line.key, line.value);
      parsedLines.push({
        lineNum: line.lineNum,
        type: isHeader ? "section-header" : "key-value",
        key: line.key,
        value: line.value,
      });
    } else if (line.value) {
      parsedLines.push({
        lineNum: line.lineNum,
        type: "continuation",
        key: "",
        value: line.value,
      });
    }
  }

  const rows: TableRow[] = [];
  let i = 0;

  while (i < parsedLines.length) {
    const line = parsedLines[i];

    if (line.type === "key-value") {
      const values: string[] = line.value ? [line.value] : [];
      i++;

      while (i < parsedLines.length && parsedLines[i].type === "continuation") {
        values.push(parsedLines[i].value);
        i++;
      }

      rows.push({ key: line.key, values, isSection: false });
    } else if (line.type === "section-header") {
      const precedingValues: string[] = [];
      const acceptedTypes = getSectionHeaderType(line.key);

      let lookBack = i - 1;
      while (lookBack >= 0 && parsedLines[lookBack].type === "continuation") {
        const contentType = getSectionContentType(parsedLines[lookBack].value);
        if (acceptedTypes.includes(contentType)) {
          precedingValues.unshift(parsedLines[lookBack].value);
          lookBack--;
        } else if (contentType === "none" && precedingValues.length > 0) {
          precedingValues.unshift(parsedLines[lookBack].value);
          lookBack--;
        } else {
          break;
        }
      }

      if (precedingValues.length > 0 && rows.length > 0) {
        const prevRow = rows[rows.length - 1];
        prevRow.values.splice(prevRow.values.length - precedingValues.length, precedingValues.length);
      }

      if (line.value) {
        precedingValues.push(line.value);
      }

      i++;

      while (i < parsedLines.length && parsedLines[i].type === "continuation") {
        precedingValues.push(parsedLines[i].value);
        i++;
      }

      rows.push({ key: line.key, values: precedingValues, isSection: true });
    } else {
      i++;
    }
  }

  const result: string[][] = [];
  for (const row of rows) {
    const valueText = row.values.length > 1
      ? row.values.join("\n")
      : row.values.length === 1
        ? row.values[0]
        : "";
    result.push([row.key, valueText]);
  }

  return result;
}
