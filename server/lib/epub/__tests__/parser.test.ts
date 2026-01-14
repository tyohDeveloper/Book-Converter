import { describe, it } from "node:test";
import assert from "node:assert";
import { extractBodyContent } from "../parser";

describe("epub-parser", () => {
  describe("extractBodyContent", () => {
    it("extracts content from body tags", () => {
      const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
        <html xmlns="http://www.w3.org/1999/xhtml">
          <head><title>Test</title></head>
          <body>
            <h1>Chapter Title</h1>
            <p>Paragraph content.</p>
          </body>
        </html>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("<h1>Chapter Title</h1>"));
      assert.ok(content.includes("<p>Paragraph content.</p>"));
      assert.ok(!content.includes("<head>"));
      assert.ok(!content.includes("<title>"));
    });

    it("handles body with attributes", () => {
      const xhtml = `<html><body class="chapter" id="ch1"><p>Content</p></body></html>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("<p>Content</p>"));
      assert.ok(!content.includes("<body"));
    });

    it("returns original content if no body tag", () => {
      const content = "<p>No body wrapper</p>";
      const result = extractBodyContent(content);
      assert.strictEqual(result, content);
    });

    it("handles empty body", () => {
      const xhtml = "<html><body></body></html>";
      const content = extractBodyContent(xhtml);
      assert.strictEqual(content, "");
    });

    it("handles multiline body content", () => {
      const xhtml = `<body>
        <h1>Title</h1>
        <p>Line 1</p>
        <p>Line 2</p>
      </body>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("<h1>Title</h1>"));
      assert.ok(content.includes("<p>Line 1</p>"));
      assert.ok(content.includes("<p>Line 2</p>"));
    });

    it("handles nested HTML elements", () => {
      const xhtml = `<body>
        <div class="container">
          <section>
            <p><strong>Bold</strong> and <em>italic</em></p>
          </section>
        </div>
      </body>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("<strong>Bold</strong>"));
      assert.ok(content.includes("<em>italic</em>"));
      assert.ok(content.includes("<section>"));
    });

    it("handles special characters in content", () => {
      const xhtml = `<body><p>Test &amp; more &lt;stuff&gt;</p></body>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("&amp;"));
      assert.ok(content.includes("&lt;stuff&gt;"));
    });

    it("preserves whitespace in pre tags", () => {
      const xhtml = `<body><pre>  code with   spaces  </pre></body>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("<pre>  code with   spaces  </pre>"));
    });

    it("handles body tag with namespace prefix", () => {
      const xhtml = `<html xmlns="http://www.w3.org/1999/xhtml">
        <body xmlns:epub="http://www.idpf.org/2007/ops">
          <p>Content</p>
        </body>
      </html>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("<p>Content</p>"));
    });

    it("handles case insensitive body tag", () => {
      const xhtml = `<BODY><p>Upper case body</p></BODY>`;
      const content = extractBodyContent(xhtml);
      assert.ok(content.includes("<p>Upper case body</p>"));
    });
  });
});
