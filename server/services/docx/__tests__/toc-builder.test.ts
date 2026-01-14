import { describe, it, expect } from "vitest";
import {
  extractHeadings,
  addHeadingIds,
  buildTocHtml,
  injectTocIntoHtml,
} from "../toc-builder";

describe("extractHeadings", () => {
  it("extracts h1 and h2 headings", () => {
    const html = `
      <h1>Chapter 1</h1>
      <p>Some content</p>
      <h2>Section 1.1</h2>
      <p>More content</p>
      <h1>Chapter 2</h1>
    `;
    const entries = extractHeadings(html);
    expect(entries).toHaveLength(3);
    expect(entries[0].text).toBe("Chapter 1");
    expect(entries[0].level).toBe(1);
    expect(entries[1].text).toBe("Section 1.1");
    expect(entries[1].level).toBe(2);
    expect(entries[2].text).toBe("Chapter 2");
  });

  it("preserves existing IDs", () => {
    const html = '<h1 id="existing-id">Title</h1>';
    const entries = extractHeadings(html);
    expect(entries[0].id).toBe("existing-id");
  });

  it("generates IDs for headings without them", () => {
    const html = "<h1>No ID Here</h1>";
    const entries = extractHeadings(html);
    expect(entries[0].id).toMatch(/^toc-heading-\d+$/);
  });

  it("skips empty headings", () => {
    const html = "<h1></h1><h1>Valid</h1><h1>   </h1>";
    const entries = extractHeadings(html);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Valid");
  });

  it("returns empty array for content without headings", () => {
    const html = "<p>Just a paragraph</p>";
    const entries = extractHeadings(html);
    expect(entries).toHaveLength(0);
  });
});

describe("addHeadingIds", () => {
  it("adds IDs to headings without them", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2>";
    const result = addHeadingIds(html);
    expect(result).toContain('id="toc-heading-1"');
    expect(result).toContain('id="toc-heading-2"');
  });

  it("preserves existing IDs", () => {
    const html = '<h1 id="my-id">Title</h1>';
    const result = addHeadingIds(html);
    expect(result).toContain('id="my-id"');
    expect(result).not.toContain("toc-heading");
  });
});

describe("buildTocHtml", () => {
  it("builds TOC with links to headings", () => {
    const entries = [
      { id: "ch1", text: "Chapter 1", level: 1 },
      { id: "ch2", text: "Chapter 2", level: 1 },
    ];
    const result = buildTocHtml(entries);
    expect(result).toContain('<a href="#ch1">Chapter 1</a>');
    expect(result).toContain('<a href="#ch2">Chapter 2</a>');
    expect(result).toContain("Table of Contents");
  });

  it("indents h2 entries", () => {
    const entries = [
      { id: "ch1", text: "Chapter 1", level: 1 },
      { id: "sec1", text: "Section 1", level: 2 },
    ];
    const result = buildTocHtml(entries);
    expect(result).toContain('margin-left: 1.5em');
  });

  it("includes document title when provided", () => {
    const entries = [{ id: "ch1", text: "Chapter 1", level: 1 }];
    const result = buildTocHtml(entries, "My Document");
    expect(result).toContain("My Document");
  });

  it("returns empty string for empty entries", () => {
    const result = buildTocHtml([]);
    expect(result).toBe("");
  });
});

describe("injectTocIntoHtml", () => {
  it("injects TOC before content when multiple headings exist", () => {
    const html = "<h1>Chapter 1</h1><p>Content</p><h1>Chapter 2</h1>";
    const result = injectTocIntoHtml(html);
    expect(result).toContain("Table of Contents");
    expect(result.indexOf("Table of Contents")).toBeLessThan(
      result.indexOf("Chapter 1</h1>")
    );
  });

  it("does not inject TOC for single heading", () => {
    const html = "<h1>Only One</h1><p>Content</p>";
    const result = injectTocIntoHtml(html);
    expect(result).not.toContain("Table of Contents");
  });

  it("adds title to TOC page when provided", () => {
    const html = "<h1>Ch 1</h1><h1>Ch 2</h1>";
    const result = injectTocIntoHtml(html, "Document Title");
    expect(result).toContain("Document Title");
  });
});
