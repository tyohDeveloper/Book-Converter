import { fileService } from "./file-service";
import { cleanupFiles } from "../common/errors/error-helpers";
import type { ManagedFile } from "../lib/file-manager/types";

export interface TempFileContext {
  file: ManagedFile;
  tempPath: string;
}

export async function withTempFiles<T>(
  sessionId: string,
  fileIds: string[],
  processor: (contexts: TempFileContext[]) => Promise<T>
): Promise<T> {
  const files = await fileService.getFilesByIds(sessionId, fileIds);
  const tempPaths: string[] = [];
  const contexts: TempFileContext[] = [];

  try {
    for (const file of files) {
      const tempPath = await fileService.downloadToTempFile(sessionId, file.id);
      tempPaths.push(tempPath);
      contexts.push({ file, tempPath });
    }

    return await processor(contexts);
  } finally {
    await cleanupFiles(tempPaths);
  }
}

export async function processFilesWithResults<R>(
  sessionId: string,
  fileIds: string[],
  processor: (context: TempFileContext) => Promise<R>,
  errorHandler: (file: ManagedFile, error: Error) => R
): Promise<R[]> {
  const files = await fileService.getFilesByIds(sessionId, fileIds);
  const results: R[] = [];
  const tempPaths: string[] = [];

  try {
    for (const file of files) {
      try {
        const tempPath = await fileService.downloadToTempFile(sessionId, file.id);
        tempPaths.push(tempPath);
        const result = await processor({ file, tempPath });
        results.push(result);
      } catch (err: any) {
        results.push(errorHandler(file, err));
      }
    }
    return results;
  } finally {
    await cleanupFiles(tempPaths);
  }
}
