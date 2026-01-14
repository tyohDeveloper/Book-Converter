import { Response } from "express";
import { fileManager } from "../lib/file-manager/file-manager";
import type { ManagedFile } from "../lib/file-manager/types";
import { stripTimestampFromFilename } from "../lib/upload-stream";

export async function downloadBatchAsZip(
  sessionId: string,
  files: ManagedFile[],
  res: Response,
  stripTimestamps: boolean = false
): Promise<void> {
  const tempPaths: string[] = [];
  
  try {
    const archiver = (await import('archiver')).default;
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="digital-bindery-files.zip"`);
    
    for (const file of files) {
      const tempPath = await fileManager.downloadToTempFile(sessionId, file.id);
      tempPaths.push(tempPath);
      let filename = file.originalName;
      if (stripTimestamps) {
        filename = stripTimestampFromFilename(filename);
      }
      archive.file(tempPath, { name: filename });
    }

    await new Promise<void>((resolve, reject) => {
      res.on('close', resolve);
      res.on('error', reject);
      archive.on('error', reject);
      archive.pipe(res);
      archive.finalize();
    });
  } finally {
    const fs = await import('fs/promises');
    for (const tempPath of tempPaths) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}

export async function downloadSingleFile(
  sessionId: string,
  file: ManagedFile,
  res: Response,
  stripTimestamps: boolean = false
): Promise<void> {
  let filename = file.originalName;
  if (stripTimestamps) {
    filename = stripTimestampFromFilename(filename);
  }
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await fileManager.streamToResponse(sessionId, file.id, res);
}
