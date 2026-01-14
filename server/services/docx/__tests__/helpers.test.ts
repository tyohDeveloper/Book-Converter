import { describe, it } from "node:test";
import assert from "node:assert";
import { buildFileToc } from "../helpers";
import type { DocxFileContent } from "../types";

describe("docx helpers", () => {
  describe("buildFileToc", () => {
    it("returns empty string for single file", () => {
      const files: DocxFileContent[] = [
        { name: "Document", fileId: "file-1", html: "<p>Content</p>" }
      ];
      const result = buildFileToc(files);
      assert.strictEqual(result, "");
    });

    it("returns empty string for empty array", () => {
      const files: DocxFileContent[] = [];
      const result = buildFileToc(files);
      assert.strictEqual(result, "");
    });

    it("builds TOC for multiple files", () => {
      const files: DocxFileContent[] = [
        { name: "Chapter 1", fileId: "file-1", html: "<p>Content 1</p>" },
        { name: "Chapter 2", fileId: "file-2", html: "<p>Content 2</p>" }
      ];
      const result = buildFileToc(files);
      assert.ok(result.includes('<nav class="toc">'));
      assert.ok(result.includes('<a href="#file-1">Chapter 1</a>'));
      assert.ok(result.includes('<a href="#file-2">Chapter 2</a>'));
      assert.ok(result.includes('</ol></nav>'));
    });

    it("escapes HTML in file names", () => {
      const files: DocxFileContent[] = [
        { name: "<script>alert('xss')</script>", fileId: "file-1", html: "" },
        { name: "Chapter & Notes", fileId: "file-2", html: "" }
      ];
      const result = buildFileToc(files);
      assert.ok(result.includes("&lt;script&gt;"));
      assert.ok(result.includes("&amp;"));
      assert.ok(!result.includes("<script>alert"));
    });
  });
});
