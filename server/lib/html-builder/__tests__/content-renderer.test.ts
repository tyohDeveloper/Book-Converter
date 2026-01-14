import { describe, it } from "node:test";
import assert from "node:assert";
import { convertTextToHtml, renderContentToXhtml } from "../content-renderer";

describe("convertTextToHtml", () => {
  it("creates sections with chapter IDs", () => {
    const text = `Intro text
Chapter 1: Beginning
Content of chapter 1
Chapter 2: Middle
Content of chapter 2`;

    const html = convertTextToHtml(text, []);
    
    assert.ok(html.includes('<section class="chapter" id="chapter-1">'));
    assert.ok(html.includes('<section class="chapter" id="chapter-2">'));
    assert.ok(html.includes('<h2 class="chapter-heading">Chapter 1: Beginning</h2>'));
    assert.ok(html.includes('<h2 class="chapter-heading">Chapter 2: Middle</h2>'));
  });

  it("uses pre-detected chapters when provided", () => {
    const text = `Line 1
Line 2
Line 3`;

    const chapters = [
      { title: "Custom Chapter", lineNumber: 2, id: "custom-id" }
    ];

    const html = convertTextToHtml(text, [], { chapters });
    
    assert.ok(html.includes('<section class="chapter" id="custom-id">'));
  });

  it("includes TOC when requested", () => {
    const text = `Chapter 1: Intro
Some content`;

    const html = convertTextToHtml(text, [], { includeToc: true });
    
    assert.ok(html.includes('<nav class="table-of-contents">'));
    assert.ok(html.includes('<a href="#chapter-1">'));
  });

  it("excludes TOC by default", () => {
    const text = `Chapter 1: Intro
Some content`;

    const html = convertTextToHtml(text, []);
    
    assert.ok(!html.includes('<nav class="table-of-contents">'));
  });
});

describe("renderContentToXhtml", () => {
  it("converts br and hr tags to self-closing", () => {
    const text = "Line 1\nLine 2";
    const xhtml = renderContentToXhtml(text);
    
    assert.ok(!xhtml.includes("<br>"));
    assert.ok(!xhtml.includes("<hr>"));
  });

  it("passes chapters option through", () => {
    const text = `Line 1
Line 2`;

    const chapters = [
      { title: "Test", lineNumber: 1, id: "test-id" }
    ];

    const xhtml = renderContentToXhtml(text, { chapters });
    
    assert.ok(xhtml.includes('id="test-id"'));
  });
});

describe("TOC and section ID matching", () => {
  it("generates matching TOC links and section IDs", () => {
    const text = `Some intro text
Chapter 1: First
First chapter content
Chapter 2: Second  
Second chapter content
Chapter 3: Third
Third chapter content`;

    const html = convertTextToHtml(text, [], { includeToc: true });
    
    const tocLinks = html.match(/href="#(chapter-\d+)"/g) || [];
    const sectionIds = html.match(/id="(chapter-\d+)"/g) || [];
    
    assert.strictEqual(tocLinks.length, 3, "Should have 3 TOC links");
    assert.strictEqual(sectionIds.length, 3, "Should have 3 section IDs");
    
    assert.ok(html.includes('href="#chapter-1"'));
    assert.ok(html.includes('id="chapter-1"'));
    assert.ok(html.includes('href="#chapter-2"'));
    assert.ok(html.includes('id="chapter-2"'));
    assert.ok(html.includes('href="#chapter-3"'));
    assert.ok(html.includes('id="chapter-3"'));
  });

  it("TOC appears before content sections", () => {
    const text = `Chapter 1: First
Content`;

    const html = convertTextToHtml(text, [], { includeToc: true });
    
    const tocPos = html.indexOf('<nav class="table-of-contents">');
    const sectionPos = html.indexOf('<section class="chapter"');
    
    assert.ok(tocPos < sectionPos, "TOC should appear before sections");
  });
});
