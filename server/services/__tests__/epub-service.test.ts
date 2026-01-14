import { describe, it } from "node:test";
import assert from "node:assert";

describe("epub-service link rewriting", () => {
  function rewriteInternalLinks(
    content: string, 
    hrefToId: Map<string, string>
  ): string {
    return content.replace(
      /href=["']([^"'#]+)(#[^"']*)?["']/gi,
      (match, href, hash) => {
        const targetId = hrefToId.get(href);
        if (targetId) {
          return `href="#${targetId}${hash || ''}"`;
        }
        if (href.endsWith('.xhtml') || href.endsWith('.html') || href.endsWith('.htm')) {
          return `href="#"`;
        }
        return match;
      }
    );
  }

  it("rewrites internal chapter links to anchor links", () => {
    const hrefToId = new Map([
      ["chapter1.xhtml", "chapter-abc-ch1"],
      ["chapter2.xhtml", "chapter-abc-ch2"],
    ]);
    const content = `<a href="chapter1.xhtml">Chapter 1</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#chapter-abc-ch1">Chapter 1</a>`);
  });

  it("preserves hash fragments when rewriting", () => {
    const hrefToId = new Map([
      ["chapter1.xhtml", "chapter-abc-ch1"],
    ]);
    const content = `<a href="chapter1.xhtml#section2">Go to section</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#chapter-abc-ch1#section2">Go to section</a>`);
  });

  it("removes links to unknown xhtml files", () => {
    const hrefToId = new Map<string, string>();
    const content = `<a href="unknown.xhtml">Unknown</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#">Unknown</a>`);
  });

  it("removes links to unknown html files", () => {
    const hrefToId = new Map<string, string>();
    const content = `<a href="page.html">Page</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#">Page</a>`);
  });

  it("preserves external links", () => {
    const hrefToId = new Map<string, string>();
    const content = `<a href="https://example.com">External</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="https://example.com">External</a>`);
  });

  it("preserves anchor-only links", () => {
    const hrefToId = new Map<string, string>();
    const content = `<a href="#existing-anchor">Jump</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#existing-anchor">Jump</a>`);
  });

  it("handles multiple links in content", () => {
    const hrefToId = new Map([
      ["ch1.xhtml", "section-1"],
      ["ch2.xhtml", "section-2"],
    ]);
    const content = `<a href="ch1.xhtml">One</a> and <a href="ch2.xhtml">Two</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.ok(result.includes('href="#section-1"'));
    assert.ok(result.includes('href="#section-2"'));
  });

  it("handles single quotes in href", () => {
    const hrefToId = new Map([
      ["chapter1.xhtml", "ch1"],
    ]);
    const content = `<a href='chapter1.xhtml'>Link</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#ch1">Link</a>`);
  });

  it("handles path-prefixed hrefs", () => {
    const hrefToId = new Map([
      ["Text/chapter1.xhtml", "ch1"],
      ["chapter1.xhtml", "ch1"],
    ]);
    const content = `<a href="Text/chapter1.xhtml">Chapter</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#ch1">Chapter</a>`);
  });

  it("preserves image src attributes", () => {
    const hrefToId = new Map<string, string>();
    const content = `<img src="image.jpg" /><a href="chapter.xhtml">Link</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.ok(result.includes('src="image.jpg"'));
  });

  it("handles .htm extension", () => {
    const hrefToId = new Map<string, string>();
    const content = `<a href="page.htm">Page</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="#">Page</a>`);
  });

  it("preserves mailto links", () => {
    const hrefToId = new Map<string, string>();
    const content = `<a href="mailto:test@example.com">Email</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="mailto:test@example.com">Email</a>`);
  });

  it("preserves javascript links", () => {
    const hrefToId = new Map<string, string>();
    const content = `<a href="javascript:void(0)">Click</a>`;
    const result = rewriteInternalLinks(content, hrefToId);
    assert.strictEqual(result, `<a href="javascript:void(0)">Click</a>`);
  });
});
