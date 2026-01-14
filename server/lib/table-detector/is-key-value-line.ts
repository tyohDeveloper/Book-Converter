import type { KeyValueResult } from "./types";

export function isKeyValueLine(
  line: string,
  valueColumnStart?: number
): KeyValueResult {
  const trimmed = line.trim();
  if (trimmed.length < 3) {
    return {
      isKeyValue: false,
      key: "",
      value: "",
      keyEndCol: 0,
      valueStartCol: 0,
      isHeaderOnly: false,
    };
  }

  const lineStartCol = line.search(/\S/);

  const gapMatch = trimmed.match(/^(\S+(?:\s\S+)?)\s{3,}(.+)$/);
  if (gapMatch) {
    const keyInLine = line.indexOf(gapMatch[1]);
    const keyEndCol = keyInLine + gapMatch[1].length;
    const valueMatch = line.match(/\s{3,}(\S)/);
    const valueStartCol = valueMatch
      ? line.indexOf(valueMatch[0]) + valueMatch[0].length - 1
      : keyEndCol + 3;

    if (valueColumnStart !== undefined && lineStartCol >= valueColumnStart - 3) {
      return {
        isKeyValue: false,
        key: "",
        value: "",
        keyEndCol: 0,
        valueStartCol: 0,
        isHeaderOnly: false,
      };
    }

    return {
      isKeyValue: true,
      key: gapMatch[1].trim(),
      value: gapMatch[2].trim(),
      keyEndCol,
      valueStartCol,
      isHeaderOnly: false,
    };
  }

  return {
    isKeyValue: false,
    key: "",
    value: "",
    keyEndCol: 0,
    valueStartCol: 0,
    isHeaderOnly: false,
  };
}
