import { Response } from "express";
import type { ManagedFile } from "../lib/file-manager/types";

export interface FileResponse {
  id: string;
  name: string;
  size: number;
  type: string;
  isOutput: boolean;
  outputType: string | null;
}

export function formatFileResponse(file: ManagedFile, type: string): FileResponse {
  return {
    id: file.id,
    name: file.originalName,
    size: file.size,
    type,
    isOutput: file.isOutput,
    outputType: file.outputType,
  };
}

export function formatFilesResponse(files: ManagedFile[], type: string): FileResponse[] {
  return files.map(f => formatFileResponse(f, type));
}

export function respondWithFile(res: Response, file: ManagedFile, type: string, extra?: Record<string, unknown>): void {
  res.json({
    success: true,
    file: formatFileResponse(file, type),
    ...extra,
  });
}

export function respondWithFiles(res: Response, files: ManagedFile[], type: string, extra?: Record<string, unknown>): void {
  res.json({
    success: true,
    files: formatFilesResponse(files, type),
    ...extra,
  });
}
