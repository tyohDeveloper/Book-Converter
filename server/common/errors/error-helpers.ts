import { logger } from "../logger";
import { FileNotFoundError, ValidationError } from "./specific-errors";

const log = logger.child({ module: "errors" });

export function assertFileExists<T>(file: T | null | undefined, fileId?: string): asserts file is T {
  if (!file) {
    throw new FileNotFoundError(fileId);
  }
}

export function assertFilesExist<T>(files: T[], minCount: number = 1): void {
  if (files.length < minCount) {
    throw new FileNotFoundError();
  }
}

export function assertValidRequest<T>(
  result: { success: true; data: T } | { success: false; error: string }
): asserts result is { success: true; data: T } {
  if (!result.success) {
    throw new ValidationError("Invalid request", result.error);
  }
}

export async function safeCleanup(
  cleanupFn: () => Promise<void>,
  context?: string
): Promise<void> {
  try {
    await cleanupFn();
  } catch (err: any) {
    log.warn("cleanup error", { context, error: err.message });
  }
}

export async function cleanupFiles(files: string[]): Promise<void> {
  const fs = await import("fs/promises");
  for (const file of files) {
    await safeCleanup(() => fs.unlink(file), file);
  }
}
