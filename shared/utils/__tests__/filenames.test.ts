import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  sanitizeFilenameForUrl,
  sanitizeFilenameForChapter,
  sanitizeFilenameForDisplay,
} from "../filenames";

describe("filenames", () => {
  describe("sanitizeFilename", () => {
    it("removes invalid characters", () => {
      expect(sanitizeFilename("test<file>name")).toBe("testfilename");
      expect(sanitizeFilename('file:with|bad*chars?')).toBe("filewithbadchars");
    });

    it("trims and handles empty", () => {
      expect(sanitizeFilename("   test   ")).toBe("test");
      expect(sanitizeFilename("")).toBe("file");
    });

    it("respects maxLength", () => {
      const longName = "a".repeat(300);
      expect(sanitizeFilename(longName, { maxLength: 50 })).toBe("a".repeat(50));
    });
  });

  describe("sanitizeFilenameForUrl", () => {
    it("converts to lowercase with hyphens", () => {
      expect(sanitizeFilenameForUrl("My File Name")).toBe("my-file-name");
      expect(sanitizeFilenameForUrl("Test123")).toBe("test123");
    });
  });

  describe("sanitizeFilenameForChapter", () => {
    it("replaces spaces with hyphens", () => {
      expect(sanitizeFilenameForChapter("Chapter One")).toBe("Chapter-One");
    });

    it("removes invalid chars and collapses hyphens", () => {
      expect(sanitizeFilenameForChapter("Chapter<1>: Test")).toBe("Chapter1-Test");
    });

    it("returns 'chapter' for empty", () => {
      expect(sanitizeFilenameForChapter("")).toBe("chapter");
    });
  });

  describe("sanitizeFilenameForDisplay", () => {
    it("removes leading/trailing dots", () => {
      expect(sanitizeFilenameForDisplay("...test...")).toBe("test");
    });

    it("returns 'file' for empty", () => {
      expect(sanitizeFilenameForDisplay("")).toBe("file");
    });

    it("respects custom maxLength", () => {
      const longName = "b".repeat(150);
      expect(sanitizeFilenameForDisplay(longName, 100)).toBe("b".repeat(100));
    });
  });
});
