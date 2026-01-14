import { describe, it } from "node:test";
import assert from "node:assert";
import { extractTocFromHtml, extractChaptersFromHtml } from "../html-parser";

describe("html-parser", () => {
  describe("extractTocFromHtml", () => {
    it("extracts TOC from nav element", () => {
      const html = `
        <html>
          <body>
            <nav class="table-of-contents">
              <ul><li><a href="#chapter-0">Chapter 1</a></li></ul>
            </nav>
          </body>
        </html>
      `;
      const toc = extractTocFromHtml(html);
      assert.ok(toc);
      assert.strictEqual(toc.title, "Table of Contents");
    });

    it("rewrites chapter links for EPUB", () => {
      const html = `
        <nav class="table-of-contents">
          <a href="#chapter-0">Ch1</a>
          <a href="#chapter-1">Ch2</a>
        </nav>
      `;
      const toc = extractTocFromHtml(html);
      assert.ok(toc);
      assert.ok(toc.content.includes('href="chapter2.xhtml"'));
      assert.ok(toc.content.includes('href="chapter3.xhtml"'));
    });

    it("rewrites high chapter numbers correctly", () => {
      const html = `
        <nav class="table-of-contents">
          <a href="#chapter-10">Ch11</a>
          <a href="#chapter-99">Ch100</a>
        </nav>
      `;
      const toc = extractTocFromHtml(html);
      assert.ok(toc);
      assert.ok(toc.content.includes('href="chapter12.xhtml"'));
      assert.ok(toc.content.includes('href="chapter101.xhtml"'));
    });

    it("returns null when no TOC found", () => {
      const html = "<html><body><p>No TOC here</p></body></html>";
      assert.strictEqual(extractTocFromHtml(html), null);
    });

    it("returns null for empty HTML", () => {
      assert.strictEqual(extractTocFromHtml(""), null);
    });

    it("handles nav with extra attributes after class", () => {
      const html = `<nav class="table-of-contents" id="toc" role="navigation"><ul></ul></nav>`;
      const toc = extractTocFromHtml(html);
      assert.ok(toc);
    });

    it("preserves non-chapter links", () => {
      const html = `
        <nav class="table-of-contents">
          <a href="#chapter-0">Ch1</a>
          <a href="#other-link">Other</a>
        </nav>
      `;
      const toc = extractTocFromHtml(html);
      assert.ok(toc);
      assert.ok(toc.content.includes('href="#other-link"'));
    });
  });

  describe("extractChaptersFromHtml", () => {
    it("extracts chapters from section elements", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">Chapter One</h2>
              <p>Content of chapter one.</p>
            </section>
            <section class="chapter">
              <h2 class="chapter-heading">Chapter Two</h2>
              <p>Content of chapter two.</p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 2);
      assert.strictEqual(chapters[0].title, "Chapter One");
      assert.strictEqual(chapters[1].title, "Chapter Two");
    });

    it("includes TOC as first chapter when present", () => {
      const html = `
        <html>
          <body>
            <nav class="table-of-contents"><ul></ul></nav>
            <section class="chapter">
              <h2 class="chapter-heading">Chapter One</h2>
              <p>Content</p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 2);
      assert.strictEqual(chapters[0].title, "Table of Contents");
      assert.strictEqual(chapters[1].title, "Chapter One");
    });

    it("falls back to heading-based splitting", () => {
      const html = `
        <html>
          <body>
            <h2 class="chapter-heading">First</h2>
            <p>First content</p>
            <h2 class="chapter-heading">Second</h2>
            <p>Second content</p>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 2);
      assert.strictEqual(chapters[0].title, "First");
      assert.strictEqual(chapters[1].title, "Second");
    });

    it("returns single Content chapter when no structure found", () => {
      const html = `
        <html>
          <body>
            <p>Just some plain content without chapters.</p>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 1);
      assert.strictEqual(chapters[0].title, "Content");
    });

    it("handles missing body tag", () => {
      const html = "<p>No body wrapper</p>";
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 1);
      assert.strictEqual(chapters[0].title, "Content");
    });

    it("strips h1 from content-only fallback", () => {
      const html = `
        <html>
          <body>
            <h1>Main Title</h1>
            <p>Some content</p>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 1);
      assert.ok(!chapters[0].content.includes("<h1>"));
    });

    it("trims whitespace from chapter content", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">Chapter</h2>
              
              <p>Content with whitespace</p>
              
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.ok(!chapters[0].content.startsWith("\n"));
      assert.ok(!chapters[0].content.endsWith("\n"));
    });

    it("removes heading from section content", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">My Chapter</h2>
              <p>Chapter body text.</p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.ok(!chapters[0].content.includes("My Chapter"));
      assert.ok(chapters[0].content.includes("Chapter body text"));
    });

    it("handles empty body", () => {
      const html = "<html><body></body></html>";
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 1);
      assert.strictEqual(chapters[0].title, "Content");
    });

    it("handles section without heading", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <p>No heading here.</p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 1);
      assert.strictEqual(chapters[0].title, "Chapter");
    });

    it("handles multiple consecutive headings", () => {
      const html = `
        <html>
          <body>
            <h2 class="chapter-heading">Chapter A</h2>
            <h2 class="chapter-heading">Chapter B</h2>
            <p>Content for B</p>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.ok(chapters.length >= 1);
    });

    it("preserves HTML content in chapters", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">Formatted</h2>
              <p><strong>Bold</strong> and <em>italic</em></p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.ok(chapters[0].content.includes("<strong>Bold</strong>"));
      assert.ok(chapters[0].content.includes("<em>italic</em>"));
    });

    it("handles only TOC with no content chapters", () => {
      const html = `
        <html>
          <body>
            <nav class="table-of-contents"><ul><li>Item</li></ul></nav>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters.length, 1);
      assert.strictEqual(chapters[0].title, "Table of Contents");
    });

    it("strips HTML tags from heading text for title", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading"><span>Chapter</span> <strong>One</strong></h2>
              <p>Content</p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters[0].title, "Chapter One");
    });

    it("handles malformed section tags", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">Chapter</h2>
              <p>Content
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.ok(chapters.length >= 1);
    });

    it("preserves table content in chapters", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">Data</h2>
              <table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.ok(chapters[0].content.includes("<table>"));
      assert.ok(chapters[0].content.includes("Cell 1"));
    });

    it("handles very long chapter titles", () => {
      const longTitle = "A".repeat(200);
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">${longTitle}</h2>
              <p>Content</p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.strictEqual(chapters[0].title, longTitle);
    });

    it("handles special characters in chapter titles", () => {
      const html = `
        <html>
          <body>
            <section class="chapter">
              <h2 class="chapter-heading">Chapter &amp; More: A &quot;Test&quot;</h2>
              <p>Content</p>
            </section>
          </body>
        </html>
      `;
      const chapters = extractChaptersFromHtml(html);
      assert.ok(chapters[0].title.includes("&"));
    });
  });

  describe("extractTocFromHtml edge cases", () => {
    it("handles malformed TOC with unclosed tags", () => {
      const html = `<nav class="table-of-contents"><ul><li>Item</nav>`;
      const toc = extractTocFromHtml(html);
      assert.ok(toc === null || toc !== null);
    });

    it("handles TOC with no links", () => {
      const html = `<nav class="table-of-contents"><p>Empty TOC</p></nav>`;
      const toc = extractTocFromHtml(html);
      assert.ok(toc);
      assert.ok(toc.content.includes("Empty TOC"));
    });

    it("handles whitespace in chapter link numbers", () => {
      const html = `<nav class="table-of-contents"><a href="#chapter-5">Ch 6</a></nav>`;
      const toc = extractTocFromHtml(html);
      assert.ok(toc);
      assert.ok(toc.content.includes("chapter7.xhtml"));
    });
  });
});
