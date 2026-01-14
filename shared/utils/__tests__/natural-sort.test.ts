import { describe, it, expect } from "vitest";
import { naturalCompare, naturalSort } from "../natural-sort";

describe("naturalCompare", () => {
  it("sorts numbers in numeric order", () => {
    expect(naturalCompare("1", "2")).toBeLessThan(0);
    expect(naturalCompare("2", "10")).toBeLessThan(0);
    expect(naturalCompare("10", "2")).toBeGreaterThan(0);
  });

  it("sorts same values as equal", () => {
    expect(naturalCompare("test", "test")).toBe(0);
    expect(naturalCompare("10", "10")).toBe(0);
  });

  it("sorts alphanumeric strings naturally", () => {
    expect(naturalCompare("file1", "file2")).toBeLessThan(0);
    expect(naturalCompare("file2", "file10")).toBeLessThan(0);
    expect(naturalCompare("file10", "file2")).toBeGreaterThan(0);
  });

  it("handles chapter numbering correctly", () => {
    expect(naturalCompare("Chapter 1", "Chapter 2")).toBeLessThan(0);
    expect(naturalCompare("Chapter 2", "Chapter 10")).toBeLessThan(0);
    expect(naturalCompare("Chapter 9", "Chapter 10")).toBeLessThan(0);
  });

  it("handles mixed case", () => {
    expect(naturalCompare("File1", "file2")).toBeLessThan(0);
  });
});

describe("naturalSort", () => {
  it("sorts array of strings naturally", () => {
    const input = ["file10", "file2", "file1", "file20"];
    const expected = ["file1", "file2", "file10", "file20"];
    expect(naturalSort(input)).toEqual(expected);
  });

  it("sorts chapter names correctly", () => {
    const input = ["Chapter 10", "Chapter 1", "Chapter 2", "Chapter 3"];
    const expected = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 10"];
    expect(naturalSort(input)).toEqual(expected);
  });

  it("handles empty array", () => {
    expect(naturalSort([])).toEqual([]);
  });

  it("handles single element", () => {
    expect(naturalSort(["only"])).toEqual(["only"]);
  });

  it("does not mutate original array", () => {
    const input = ["b", "a", "c"];
    const original = [...input];
    naturalSort(input);
    expect(input).toEqual(original);
  });

  it("sorts objects by key", () => {
    const input = [
      { name: "file10.pdf" },
      { name: "file2.pdf" },
      { name: "file1.pdf" },
    ];
    const result = naturalSort(input, (item) => item.name);
    expect(result.map((r) => r.name)).toEqual([
      "file1.pdf",
      "file2.pdf",
      "file10.pdf",
    ]);
  });
});
