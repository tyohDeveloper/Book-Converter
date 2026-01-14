import fs from "fs";

export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  for (const tempFile of filePaths) {
    try {
      await fs.promises.unlink(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
