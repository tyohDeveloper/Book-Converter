import { describe, it } from "node:test";
import assert from "node:assert";
import { detectChapters, generateTocHtml, isChapterHeading } from "../chapter-detector";

describe("isChapterHeading", () => {
  it("detects numbered chapters", () => {
    assert.strictEqual(isChapterHeading("Chapter 1"), true);
    assert.strictEqual(isChapterHeading("Chapter 10: Introduction"), true);
    assert.strictEqual(isChapterHeading("Chapter I"), true);
  });

  it("detects named sections", () => {
    assert.strictEqual(isChapterHeading("Prologue"), true);
    assert.strictEqual(isChapterHeading("Introduction"), true);
    assert.strictEqual(isChapterHeading("Epilogue"), true);
  });

  it("rejects non-chapter lines", () => {
    assert.strictEqual(isChapterHeading("This is regular text"), false);
    assert.strictEqual(isChapterHeading("The chapter was good"), false);
  });
});

describe("detectChapters", () => {
  it("detects chapters with sequential IDs", () => {
    const text = `Some intro text
Chapter 1: The Beginning
Some content here
Chapter 2: The Middle
More content
Chapter 3: The End`;

    const chapters = detectChapters(text);
    
    assert.strictEqual(chapters.length, 3);
    assert.strictEqual(chapters[0].title, "Chapter 1: The Beginning");
    assert.strictEqual(chapters[0].id, "chapter-1");
    assert.strictEqual(chapters[0].lineNumber, 2);
    
    assert.strictEqual(chapters[1].title, "Chapter 2: The Middle");
    assert.strictEqual(chapters[1].id, "chapter-2");
    assert.strictEqual(chapters[1].lineNumber, 4);
    
    assert.strictEqual(chapters[2].title, "Chapter 3: The End");
    assert.strictEqual(chapters[2].id, "chapter-3");
    assert.strictEqual(chapters[2].lineNumber, 6);
  });

  it("handles empty text", () => {
    const chapters = detectChapters("");
    assert.strictEqual(chapters.length, 0);
  });

  it("handles text with no chapters", () => {
    const text = "Just some regular content\nwithout any chapters";
    const chapters = detectChapters(text);
    assert.strictEqual(chapters.length, 0);
  });
});

describe("generateTocHtml", () => {
  it("generates TOC with correct links", () => {
    const chapters = [
      { title: "Chapter 1: Intro", lineNumber: 1, id: "chapter-1" },
      { title: "Chapter 2: Body", lineNumber: 10, id: "chapter-2" },
    ];

    const toc = generateTocHtml(chapters);
    
    assert.ok(toc.includes('<nav class="table-of-contents">'));
    assert.ok(toc.includes('<a href="#chapter-1">Chapter 1: Intro</a>'));
    assert.ok(toc.includes('<a href="#chapter-2">Chapter 2: Body</a>'));
    assert.ok(toc.includes('</nav>'));
  });

  it("returns empty string for no chapters", () => {
    const toc = generateTocHtml([]);
    assert.strictEqual(toc, "");
  });

  it("escapes HTML in chapter titles", () => {
    const chapters = [
      { title: "Chapter 1: <script>alert('xss')</script>", lineNumber: 1, id: "chapter-1" },
    ];

    const toc = generateTocHtml(chapters);
    
    assert.ok(!toc.includes("<script>"));
    assert.ok(toc.includes("&lt;script&gt;"));
  });
});
