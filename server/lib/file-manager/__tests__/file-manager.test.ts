import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { toManagedFile, SESSION_TTL, MIME_TYPES, FILE_EXTENSIONS, type ManagedFile } from "../types";

describe("file-manager types", () => {
  describe("toManagedFile", () => {
    it("converts database file to ManagedFile", () => {
      const dbFile = {
        id: "file-123",
        sessionId: "session-456",
        originalName: "test.pdf",
        storageKey: "file-123.pdf",
        size: 1024,
        uploadedAt: new Date("2024-01-01"),
        mimeType: "application/pdf",
        isOutput: false,
        outputType: null,
      };

      const result = toManagedFile(dbFile);

      assert.strictEqual(result.id, "file-123");
      assert.strictEqual(result.originalName, "test.pdf");
      assert.strictEqual(result.storageKey, "file-123.pdf");
      assert.strictEqual(result.size, 1024);
      assert.strictEqual(result.mimeType, "application/pdf");
      assert.strictEqual(result.isOutput, false);
      assert.strictEqual(result.outputType, null);
    });

    it("handles output files", () => {
      const dbFile = {
        id: "out-789",
        sessionId: "session-456",
        originalName: "output.epub",
        storageKey: "out-789.epub",
        size: 2048,
        uploadedAt: new Date("2024-01-01"),
        mimeType: "application/epub+zip",
        isOutput: true,
        outputType: "epub",
      };

      const result = toManagedFile(dbFile);

      assert.strictEqual(result.isOutput, true);
      assert.strictEqual(result.outputType, "epub");
    });

    it("preserves Date object for uploadedAt", () => {
      const date = new Date("2024-06-15T12:30:00Z");
      const dbFile = {
        id: "file-1",
        sessionId: "session-1",
        originalName: "test.pdf",
        storageKey: "file-1.pdf",
        size: 100,
        uploadedAt: date,
        mimeType: "application/pdf",
        isOutput: false,
        outputType: null,
      };

      const result = toManagedFile(dbFile);
      assert.strictEqual(result.uploadedAt.getTime(), date.getTime());
    });

    it("handles all output types", () => {
      const outputTypes = ["epub", "pdf", "compressed", "html"];
      
      for (const outputType of outputTypes) {
        const dbFile = {
          id: `out-${outputType}`,
          sessionId: "session-1",
          originalName: `output.${outputType}`,
          storageKey: `out-${outputType}.${outputType}`,
          size: 1000,
          uploadedAt: new Date(),
          mimeType: MIME_TYPES[outputType] || "application/octet-stream",
          isOutput: true,
          outputType,
        };

        const result = toManagedFile(dbFile);
        assert.strictEqual(result.outputType, outputType);
      }
    });
  });

  describe("constants", () => {
    it("SESSION_TTL is 24 hours in milliseconds", () => {
      assert.strictEqual(SESSION_TTL, 24 * 60 * 60 * 1000);
      assert.strictEqual(SESSION_TTL, 86400000);
    });

    it("MIME_TYPES has correct mappings", () => {
      assert.strictEqual(MIME_TYPES.epub, "application/epub+zip");
      assert.strictEqual(MIME_TYPES.pdf, "application/pdf");
      assert.strictEqual(MIME_TYPES.compressed, "application/pdf");
      assert.strictEqual(MIME_TYPES.html, "text/html");
    });

    it("FILE_EXTENSIONS has correct mappings", () => {
      assert.strictEqual(FILE_EXTENSIONS.epub, ".epub");
      assert.strictEqual(FILE_EXTENSIONS.pdf, ".pdf");
      assert.strictEqual(FILE_EXTENSIONS.compressed, ".pdf");
      assert.strictEqual(FILE_EXTENSIONS.html, ".html");
    });

    it("FILE_EXTENSIONS and MIME_TYPES have matching keys", () => {
      const mimeKeys = Object.keys(MIME_TYPES).sort();
      const extKeys = Object.keys(FILE_EXTENSIONS).sort();
      assert.deepStrictEqual(mimeKeys, extKeys);
    });
  });

  describe("ManagedFile interface", () => {
    it("can be used with type assertion", () => {
      const file: ManagedFile = {
        id: "test-id",
        originalName: "test.pdf",
        storageKey: "test-id.pdf",
        size: 500,
        uploadedAt: new Date(),
        mimeType: "application/pdf",
        isOutput: false,
        outputType: null,
      };

      assert.ok(file.id);
      assert.ok(file.originalName);
      assert.ok(file.storageKey);
    });
  });
});

describe("naturalCompare from shared utils", () => {
  it("sorts alphanumerically", async () => {
    const { naturalCompare } = await import('../../../../shared/utils');
    const items = ['file10.pdf', 'file2.pdf', 'file1.pdf'];
    items.sort(naturalCompare);
    assert.deepStrictEqual(items, ['file1.pdf', 'file2.pdf', 'file10.pdf']);
  });

  it("handles chapter numbering correctly", async () => {
    const { naturalCompare } = await import('../../../../shared/utils');
    const items = ['Chapter 10', 'Chapter 1', 'Chapter 2', 'Chapter 20'];
    items.sort(naturalCompare);
    assert.deepStrictEqual(items, ['Chapter 1', 'Chapter 2', 'Chapter 10', 'Chapter 20']);
  });
});
