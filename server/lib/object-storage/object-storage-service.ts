import type { Response } from "express";
import { logger } from "../../common/logger";
import { signObjectURL, buildObjectPath } from "./signer";
import { uploadBuffer as uploadBufferUtil } from "./upload-buffer";
import { uploadFile as uploadFileUtil } from "./upload-file";
import { downloadToFile as downloadToFileUtil } from "./download-to-file";
import { streamToResponse as streamToResponseUtil } from "./stream-to-response";
import { deleteObject } from "./delete-object";
import { objectExists } from "./object-exists";

const log = logger.child({ module: "object-storage" });

export class ObjectStorageService {
  private bucketName: string;
  private privateDir: string;

  constructor() {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    }
    this.bucketName = bucketId;
    
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    if (!privateDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    this.privateDir = privateDir;
  }

  async getUploadURL(sessionId: string, fileId: string, contentType: string = "application/pdf"): Promise<string> {
    return signObjectURL({
      bucketName: this.bucketName,
      objectName: buildObjectPath(sessionId, fileId),
      method: "PUT",
      ttlSec: 900,
      contentType,
    });
  }

  async getDownloadURL(sessionId: string, fileId: string): Promise<string> {
    return signObjectURL({
      bucketName: this.bucketName,
      objectName: buildObjectPath(sessionId, fileId),
      method: "GET",
      ttlSec: 3600,
    });
  }

  async uploadFile(sessionId: string, fileId: string, filePath: string, contentType: string = "application/pdf"): Promise<void> {
    log.debug("uploading file", { session: sessionId, fileId, path: filePath });
    const uploadUrl = await this.getUploadURL(sessionId, fileId, contentType);
    log.debug("got signed upload URL");
    await uploadFileUtil(uploadUrl, filePath, contentType);
  }

  async uploadBuffer(sessionId: string, fileId: string, buffer: Buffer, contentType: string = "application/pdf"): Promise<void> {
    const uploadUrl = await this.getUploadURL(sessionId, fileId, contentType);
    await uploadBufferUtil(uploadUrl, buffer, contentType);
  }

  async downloadToFile(sessionId: string, fileId: string, destPath: string): Promise<void> {
    const downloadUrl = await this.getDownloadURL(sessionId, fileId);
    await downloadToFileUtil(downloadUrl, destPath);
  }

  async streamToResponse(sessionId: string, fileId: string, res: Response, filename: string, contentType: string, inline: boolean = false): Promise<void> {
    const downloadUrl = await this.getDownloadURL(sessionId, fileId);
    await streamToResponseUtil(downloadUrl, res, filename, contentType, inline);
  }

  async deleteFile(sessionId: string, fileId: string): Promise<void> {
    const deleteUrl = await signObjectURL({
      bucketName: this.bucketName,
      objectName: buildObjectPath(sessionId, fileId),
      method: "DELETE",
      ttlSec: 60,
    });
    await deleteObject(deleteUrl);
  }

  async fileExists(sessionId: string, fileId: string): Promise<boolean> {
    const headUrl = await signObjectURL({
      bucketName: this.bucketName,
      objectName: buildObjectPath(sessionId, fileId),
      method: "HEAD",
      ttlSec: 60,
    });
    return objectExists(headUrl);
  }
}

let objectStorageInstance: ObjectStorageService | null = null;

export function getObjectStorage(): ObjectStorageService {
  if (!objectStorageInstance) {
    objectStorageInstance = new ObjectStorageService();
  }
  return objectStorageInstance;
}
