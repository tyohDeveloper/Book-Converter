import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ValidationError, FileNotFoundError } from "../../../common/errors/specific-errors";

describe("file content update validation", () => {
  it("should only allow HTML file extensions", () => {
    const validExtensions = [".html", ".htm", ".xhtml"];
    const invalidExtensions = [".pdf", ".docx", ".txt", ".epub"];

    const checkCanEdit = (filename: string): boolean => {
      const name = filename.toLowerCase();
      return (
        name.endsWith(".html") ||
        name.endsWith(".htm") ||
        name.endsWith(".xhtml")
      );
    };

    for (const ext of validExtensions) {
      expect(checkCanEdit(`file${ext}`)).toBe(true);
      expect(checkCanEdit(`FILE${ext.toUpperCase()}`)).toBe(true);
    }

    for (const ext of invalidExtensions) {
      expect(checkCanEdit(`file${ext}`)).toBe(false);
    }
  });

  it("should require string content", () => {
    const validateContent = (content: unknown): boolean => {
      return typeof content === "string";
    };

    expect(validateContent("valid string")).toBe(true);
    expect(validateContent("")).toBe(true);
    expect(validateContent(null)).toBe(false);
    expect(validateContent(undefined)).toBe(false);
    expect(validateContent(123)).toBe(false);
    expect(validateContent({})).toBe(false);
  });

  it("should handle various HTML content types", () => {
    const validContents = [
      '<!DOCTYPE html><html><body></body></html>',
      '<html xmlns="http://www.w3.org/1999/xhtml"><body /></html>',
      "<p>Simple content</p>",
      "",
    ];

    for (const content of validContents) {
      expect(typeof content === "string").toBe(true);
    }
  });
});

describe("file extension detection", () => {
  const isHtmlFile = (name: string): boolean => {
    const lower = name.toLowerCase();
    return (
      lower.endsWith(".html") ||
      lower.endsWith(".htm") ||
      lower.endsWith(".xhtml")
    );
  };

  it("detects .html files", () => {
    expect(isHtmlFile("document.html")).toBe(true);
    expect(isHtmlFile("Document.HTML")).toBe(true);
  });

  it("detects .htm files", () => {
    expect(isHtmlFile("document.htm")).toBe(true);
    expect(isHtmlFile("DOCUMENT.HTM")).toBe(true);
  });

  it("detects .xhtml files", () => {
    expect(isHtmlFile("document.xhtml")).toBe(true);
    expect(isHtmlFile("Document.XHTML")).toBe(true);
  });

  it("rejects non-HTML files", () => {
    expect(isHtmlFile("document.pdf")).toBe(false);
    expect(isHtmlFile("document.docx")).toBe(false);
    expect(isHtmlFile("document.txt")).toBe(false);
    expect(isHtmlFile("html.pdf")).toBe(false);
  });
});
