import { describe, it, expect } from "vitest";
import { groupItemsIntoLines } from "../line-grouper";
import type { RawTextItem } from "../types";

describe("groupItemsIntoLines", () => {
  it("returns empty array for empty input", () => {
    expect(groupItemsIntoLines([])).toEqual([]);
  });

  it("groups items on same baseline into one line", () => {
    const items: RawTextItem[] = [
      { text: "Hello ", x: 0, y: 100, isItalic: false, isBold: false, hasEOL: false },
      { text: "world", x: 50, y: 100, isItalic: false, isBold: false, hasEOL: false },
    ];
    const lines = groupItemsIntoLines(items);
    expect(lines).toHaveLength(1);
    expect(lines[0].spans).toHaveLength(1);
    expect(lines[0].spans[0].text).toBe("Hello world");
  });

  it("separates items on different baselines into different lines", () => {
    const items: RawTextItem[] = [
      { text: "Line 1", x: 0, y: 100, isItalic: false, isBold: false, hasEOL: false },
      { text: "Line 2", x: 0, y: 120, isItalic: false, isBold: false, hasEOL: false },
    ];
    const lines = groupItemsIntoLines(items);
    expect(lines).toHaveLength(2);
    expect(lines[0].spans[0].text).toBe("Line 1");
    expect(lines[1].spans[0].text).toBe("Line 2");
  });

  it("creates separate spans for different styles", () => {
    const items: RawTextItem[] = [
      { text: "Normal ", x: 0, y: 100, isItalic: false, isBold: false, hasEOL: false },
      { text: "italic", x: 50, y: 100, isItalic: true, isBold: false, hasEOL: false },
    ];
    const lines = groupItemsIntoLines(items);
    expect(lines).toHaveLength(1);
    expect(lines[0].spans).toHaveLength(2);
    expect(lines[0].spans[0].text).toBe("Normal ");
    expect(lines[0].spans[0].isItalic).toBe(false);
    expect(lines[0].spans[1].text).toBe("italic");
    expect(lines[0].spans[1].isItalic).toBe(true);
  });

  it("respects hasEOL to force line break", () => {
    const items: RawTextItem[] = [
      { text: "First", x: 0, y: 100, isItalic: false, isBold: false, hasEOL: true },
      { text: "Second", x: 0, y: 100, isItalic: false, isBold: false, hasEOL: false },
    ];
    const lines = groupItemsIntoLines(items);
    expect(lines).toHaveLength(2);
  });
});
