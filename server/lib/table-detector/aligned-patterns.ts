/**
 * Aligned column table detection patterns
 */

import type { ColumnAlignment } from "./types";

export function isAlignedColumnLine(
  line: string,
  previousColumns?: number[]
): ColumnAlignment {
  const words = line.match(/\S+/g);
  if (!words || words.length < 2) {
    return { isAligned: false, columns: [] };
  }

  const columns: number[] = [];
  let pos = 0;
  for (const word of words) {
    const idx = line.indexOf(word, pos);
    columns.push(idx);
    pos = idx + word.length;
  }

  if (!previousColumns || previousColumns.length === 0) {
    return { isAligned: true, columns };
  }

  if (columns.length !== previousColumns.length) {
    return { isAligned: false, columns };
  }

  const tolerance = 3;
  for (let i = 0; i < columns.length; i++) {
    if (Math.abs(columns[i] - previousColumns[i]) > tolerance) {
      return { isAligned: false, columns };
    }
  }

  return { isAligned: true, columns };
}
