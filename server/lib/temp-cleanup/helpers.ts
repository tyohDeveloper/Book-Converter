import { tempCleanup } from './tracker';

export async function cleanupTempFile(filePath: string): Promise<void> {
  return tempCleanup.cleanupFile(filePath);
}

export async function cleanupAllTempFiles(files: string[]): Promise<void> {
  return tempCleanup.cleanupFiles(files);
}

export async function cleanupUploadedFile(filePath: string): Promise<void> {
  return tempCleanup.cleanupFile(filePath);
}
