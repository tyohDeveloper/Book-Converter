import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function createTempFile(content: string, extension: string = 'txt'): Promise<string> {
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
  await fs.writeFile(tempPath, content, 'utf8');
  return tempPath;
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (e) {
  }
}
