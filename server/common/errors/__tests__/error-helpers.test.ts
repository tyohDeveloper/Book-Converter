import { describe, it, expect, vi } from "vitest";
import {
  assertFileExists,
  assertFilesExist,
  assertValidRequest,
  safeCleanup,
} from "../error-helpers";
import { ErrorCode } from "../error-codes";
import type { AppError } from "../app-error";

describe("assertFileExists", () => {
  it("passes for non-null value", () => {
    const file = { id: "123", name: "test.pdf" };
    expect(() => assertFileExists(file)).not.toThrow();
  });

  it("throws FileNotFoundError for null", () => {
    try {
      assertFileExists(null, "file123");
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.FILE_NOT_FOUND);
    }
  });

  it("throws FileNotFoundError for undefined", () => {
    try {
      assertFileExists(undefined);
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.FILE_NOT_FOUND);
    }
  });

  it("includes fileId in error message", () => {
    try {
      assertFileExists(null, "file123");
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as AppError).message).toContain("file123");
    }
  });
});

describe("assertFilesExist", () => {
  it("passes for array with items", () => {
    expect(() => assertFilesExist([1, 2, 3])).not.toThrow();
  });

  it("throws for empty array", () => {
    try {
      assertFilesExist([]);
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.FILE_NOT_FOUND);
    }
  });

  it("throws when fewer than minCount", () => {
    try {
      assertFilesExist([1], 2);
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.FILE_NOT_FOUND);
    }
  });

  it("passes when exactly minCount", () => {
    expect(() => assertFilesExist([1, 2], 2)).not.toThrow();
  });
});

describe("assertValidRequest", () => {
  it("passes for success result", () => {
    const result = { success: true as const, data: { foo: "bar" } };
    expect(() => assertValidRequest(result)).not.toThrow();
  });

  it("throws ValidationError for failure result", () => {
    const result = { success: false as const, error: "field is required" };
    try {
      assertValidRequest(result);
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it("includes error message in details", () => {
    const result = { success: false as const, error: "specific error" };
    try {
      assertValidRequest(result);
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as AppError).details).toBe("specific error");
    }
  });
});

describe("safeCleanup", () => {
  it("calls cleanup function", async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    await safeCleanup(cleanup, "test context");
    expect(cleanup).toHaveBeenCalled();
  });

  it("does not throw when cleanup fails", async () => {
    const cleanup = vi.fn().mockRejectedValue(new Error("cleanup failed"));
    await expect(safeCleanup(cleanup, "test")).resolves.toBeUndefined();
  });
});
