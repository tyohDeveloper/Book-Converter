import { describe, it, expect } from "vitest";
import { isLikelyHeading } from "../heading-detector";

describe("isLikelyHeading", () => {
  it("detects chapter headings", () => {
    expect(isLikelyHeading("Chapter 1")).toBe(true);
    expect(isLikelyHeading("CHAPTER ONE")).toBe(true);
    expect(isLikelyHeading("Chapter 12: The Beginning")).toBe(true);
  });

  it("detects part/section headings", () => {
    expect(isLikelyHeading("Part I")).toBe(true);
    expect(isLikelyHeading("Section 5")).toBe(true);
    expect(isLikelyHeading("PART THREE")).toBe(true);
  });

  it("detects special sections with following text", () => {
    expect(isLikelyHeading("Prologue - The Beginning")).toBe(true);
    expect(isLikelyHeading("Epilogue - The End")).toBe(true);
    expect(isLikelyHeading("Introduction to the Story")).toBe(true);
    expect(isLikelyHeading("Conclusion and Summary")).toBe(true);
  });

  it("detects standalone special sections as all-caps", () => {
    expect(isLikelyHeading("PROLOGUE")).toBe(true);
    expect(isLikelyHeading("EPILOGUE")).toBe(true);
    expect(isLikelyHeading("INTRODUCTION")).toBe(true);
  });

  it("detects Roman numeral headings", () => {
    expect(isLikelyHeading("I. Introduction")).toBe(true);
    expect(isLikelyHeading("XII. Final Chapter")).toBe(true);
  });

  it("detects numbered headings", () => {
    expect(isLikelyHeading("1. The Beginning")).toBe(true);
    expect(isLikelyHeading("12. Another Section")).toBe(true);
  });

  it("detects all-caps titles", () => {
    expect(isLikelyHeading("THE END")).toBe(true);
    expect(isLikelyHeading("BOOK ONE")).toBe(true);
  });

  it("rejects long lines", () => {
    const longLine = "This is a very long line that exceeds eighty characters and should not be considered a heading at all";
    expect(isLikelyHeading(longLine)).toBe(false);
  });

  it("rejects regular prose", () => {
    expect(isLikelyHeading("The quick brown fox jumps over the lazy dog.")).toBe(false);
    expect(isLikelyHeading("She walked into the room and sat down.")).toBe(false);
  });
});
