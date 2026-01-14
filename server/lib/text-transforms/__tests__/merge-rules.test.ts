import { describe, it, expect } from "vitest";
import { shouldMergeWithNext } from "../merge-rules";

describe("shouldMergeWithNext", () => {
  const defaultSensitivity = 50;

  it("returns false when next line is undefined", () => {
    expect(shouldMergeWithNext("Some text", undefined, defaultSensitivity)).toBe(false);
  });

  it("returns false when next line is empty", () => {
    expect(shouldMergeWithNext("Some text", "", defaultSensitivity)).toBe(false);
    expect(shouldMergeWithNext("Some text", "   ", defaultSensitivity)).toBe(false);
  });

  it("returns false when current line is a heading", () => {
    expect(shouldMergeWithNext("Chapter 1", "Some content follows.", defaultSensitivity)).toBe(false);
    expect(shouldMergeWithNext("INTRODUCTION", "The story begins here.", defaultSensitivity)).toBe(false);
  });

  it("returns false when next line is a heading", () => {
    expect(shouldMergeWithNext("End of previous section.", "Chapter 2", defaultSensitivity)).toBe(false);
  });

  it("returns false for dialogue breaks", () => {
    expect(shouldMergeWithNext(
      '"Goodbye," she said.',
      '"Hello," he replied.',
      defaultSensitivity
    )).toBe(false);
  });

  it("allows merging regular prose", () => {
    expect(shouldMergeWithNext(
      "The quick brown fox",
      "jumps over the lazy dog.",
      defaultSensitivity
    )).toBe(true);
  });

  it("allows merging with continuation punctuation", () => {
    expect(shouldMergeWithNext(
      "She looked at him,",
      "wondering what to say.",
      defaultSensitivity
    )).toBe(true);
  });

  it("respects sensitivity for short lines", () => {
    expect(shouldMergeWithNext("Short line", "Next line.", 10)).toBe(false);
    expect(shouldMergeWithNext("Short line", "Next line.", 50)).toBe(true);
  });
});
