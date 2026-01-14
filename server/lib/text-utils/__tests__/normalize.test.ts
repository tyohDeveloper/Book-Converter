import { describe, it, expect } from "vitest";
import { normalizeForComparison, stripDuplicateFirstHtmlElement } from "../normalize";

describe("normalizeForComparison", () => {
  it("removes HTML tags", () => {
    expect(normalizeForComparison("<p>Hello</p>")).toBe("hello");
  });

  it("removes leading numbering", () => {
    expect(normalizeForComparison("1. Chapter One")).toBe("chapter one");
    expect(normalizeForComparison("42. Title")).toBe("title");
  });

  it("normalizes whitespace", () => {
    expect(normalizeForComparison("  hello   world  ")).toBe("hello world");
  });

  it("converts to lowercase", () => {
    expect(normalizeForComparison("HELLO WORLD")).toBe("hello world");
  });

  it("handles mixed content", () => {
    expect(normalizeForComparison("<h1>1. Chapter One</h1>")).toBe("chapter one");
  });

  it("handles empty string", () => {
    expect(normalizeForComparison("")).toBe("");
  });

  it("handles only numbers", () => {
    expect(normalizeForComparison("123")).toBe("123");
  });

  it("strips file extensions", () => {
    expect(normalizeForComparison("Test File.xhtml")).toBe("test file");
    expect(normalizeForComparison("Chapter One.html")).toBe("chapter one");
    expect(normalizeForComparison("Document.pdf")).toBe("document");
  });

  it("matches heading text to filename", () => {
    const heading = normalizeForComparison("Test File");
    const filename = normalizeForComparison("Test File.xhtml");
    expect(heading).toBe(filename);
  });

  it("handles dashes and special characters for fuzzy matching", () => {
    const heading1 = normalizeForComparison("Chapter 1 – Intro");
    const heading2 = normalizeForComparison("Chapter 1 - Intro");
    const heading3 = normalizeForComparison("Chapter 1 Intro");
    expect(heading1).toBe("chapter 1 intro");
    expect(heading2).toBe("chapter 1 intro");
    expect(heading3).toBe("chapter 1 intro");
  });

  it("handles apostrophes", () => {
    const heading = normalizeForComparison("John's Story");
    expect(heading).toBe("johns story");
  });

  it("handles numbered filenames with special chars", () => {
    const filename = normalizeForComparison("01 – Chapter One.xhtml");
    expect(filename).toBe("01 chapter one");
  });
});

describe("stripDuplicateFirstHtmlElement", () => {
  it("removes duplicate first element matching file name", () => {
    const html = "<h1>Test File</h1>\n<p>Content here</p>";
    const result = stripDuplicateFirstHtmlElement(html, "Test File.xhtml");
    
    expect(result).not.toContain("<h1>Test File</h1>");
    expect(result).toContain("<p>Content here</p>");
  });

  it("preserves first element when it does not match", () => {
    const html = "<h1>Different Title</h1>\n<p>Content</p>";
    const result = stripDuplicateFirstHtmlElement(html, "Test File.xhtml");
    
    expect(result).toContain("<h1>Different Title</h1>");
  });

  it("handles numbered file names", () => {
    const html = "<h2>Chapter One</h2>\n<p>Story begins</p>";
    const result = stripDuplicateFirstHtmlElement(html, "01. Chapter One.xhtml");
    
    expect(result).not.toContain("<h2>Chapter One</h2>");
    expect(result).toContain("<p>Story begins</p>");
  });

  it("handles p tags as first element", () => {
    const html = "<p>Introduction</p>\n<p>More text</p>";
    const result = stripDuplicateFirstHtmlElement(html, "Introduction.xhtml");
    
    expect(result).not.toContain("<p>Introduction</p>");
    expect(result).toContain("<p>More text</p>");
  });

  it("handles empty html", () => {
    const result = stripDuplicateFirstHtmlElement("", "Test.xhtml");
    expect(result).toBe("");
  });

  it("handles html without block elements", () => {
    const html = "Plain text content";
    const result = stripDuplicateFirstHtmlElement(html, "Test.xhtml");
    expect(result).toBe("Plain text content");
  });

  it("handles whitespace before first element", () => {
    const html = "\n  <h1>Title</h1>\n<p>Content</p>";
    const result = stripDuplicateFirstHtmlElement(html, "Title.html");
    
    expect(result.trim()).toBe("<p>Content</p>");
  });
});
