import { fileManager } from "../lib/file-manager/file-manager";
import type { ManagedFile } from "../lib/file-manager/types";
import { FileNotFoundError, SessionNotFoundError, UploadError } from "../common/errors/specific-errors";
import { cleanupFiles } from "../common/errors/error-helpers";
import type { FileInfo } from "@shared/contracts/common";

export interface UploadedFileInfo {
  originalName: string;
  filePath: string;
  size: number;
}

export class FileService {
  async createSession(): Promise<string> {
    return fileManager.createSession();
  }

  async uploadFiles(sessionId: string, files: UploadedFileInfo[]): Promise<ManagedFile[]> {
    if (files.length === 0) {
      throw new UploadError("No files uploaded");
    }

    const uploadedFiles: ManagedFile[] = [];

    for (const file of files) {
      const managedFile = await fileManager.addFile(
        sessionId,
        file.originalName,
        file.filePath,
        file.size,
        "application/pdf"
      );
      uploadedFiles.push(managedFile);
    }

    return uploadedFiles;
  }

  async getFiles(sessionId: string): Promise<ManagedFile[]> {
    return fileManager.getFiles(sessionId);
  }

  async getFile(sessionId: string, fileId: string): Promise<ManagedFile> {
    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new FileNotFoundError(fileId);
    }
    return file;
  }

  async getFilesByIds(sessionId: string, fileIds: string[]): Promise<ManagedFile[]> {
    const files = await fileManager.getFilesByIds(sessionId, fileIds);
    if (files.length === 0) {
      throw new FileNotFoundError();
    }
    return files;
  }

  async getPdfFiles(sessionId: string, fileIds: string[]): Promise<ManagedFile[]> {
    const allFiles = await this.getFilesByIds(sessionId, fileIds);
    const pdfFiles = allFiles.filter((f) => f.originalName.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      throw new UploadError("No PDF files selected. Please select PDF files to convert.");
    }
    return pdfFiles;
  }

  async deleteFile(sessionId: string, fileId: string): Promise<boolean> {
    const success = await fileManager.deleteFile(sessionId, fileId);
    if (!success) {
      throw new FileNotFoundError(fileId);
    }
    return true;
  }

  async clearSession(sessionId: string): Promise<void> {
    await fileManager.clearSession(sessionId);
  }

  async downloadToTempFile(sessionId: string, fileId: string): Promise<string> {
    return fileManager.downloadToTempFile(sessionId, fileId);
  }

  async addOutputFile(
    sessionId: string,
    name: string,
    tempPath: string,
    outputType: "pdf" | "epub" | "compressed" | "html"
  ): Promise<ManagedFile> {
    return fileManager.addOutputFile(sessionId, name, tempPath, outputType);
  }

  async streamToResponse(
    sessionId: string,
    fileId: string,
    res: any,
    inline?: boolean
  ): Promise<void> {
    await fileManager.streamToResponse(sessionId, fileId, res, inline);
  }

  toFileInfo(file: ManagedFile): FileInfo {
    return {
      id: file.id,
      name: file.originalName,
      size: file.size,
      uploadedAt: file.uploadedAt,
      isOutput: file.isOutput,
      outputType: file.outputType,
    };
  }
}

export const fileService = new FileService();
