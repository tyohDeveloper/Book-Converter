import { Request } from "express";
import Busboy from "busboy";
import path from "path";
import * as fsSync from "fs";
import { config } from "../common/config";

export interface UploadedFileInfo {
  originalName: string;
  filePath: string;
  size: number;
}

export function streamUpload(req: Request): Promise<UploadedFileInfo[]> {
  return new Promise((resolve, reject) => {
    const files: UploadedFileInfo[] = [];
    const writePromises: Promise<void>[] = [];

    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: Infinity },
      highWaterMark: config.uploads.chunkSize,
    });

    busboy.on("file", (fieldname, file, info) => {
      const { filename } = info;
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(config.uploads.baseDir, `${uniqueSuffix}-${safeName}`);

      let fileSize = 0;
      const writeStream = fsSync.createWriteStream(filePath, {
        highWaterMark: config.uploads.chunkSize,
      });

      const writePromise = new Promise<void>((resolveWrite, rejectWrite) => {
        file.on("data", (chunk: Buffer) => {
          fileSize += chunk.length;
        });

        file.on("end", () => {
          files.push({ originalName: filename, filePath, size: fileSize });
        });

        writeStream.on("finish", resolveWrite);
        writeStream.on("error", rejectWrite);
        file.on("error", rejectWrite);
      });

      writePromises.push(writePromise);
      file.pipe(writeStream);
    });

    busboy.on("finish", async () => {
      try {
        await Promise.all(writePromises);
        resolve(files);
      } catch (err) {
        reject(err);
      }
    });

    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

export function stripTimestampFromFilename(filename: string): string {
  return filename.replace(/-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?=\.[^.]+$)/, '');
}
