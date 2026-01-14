import fs from 'fs/promises';
import { getObjectStorage, ObjectStorageService } from '../object-storage/object-storage-service';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';
import { getExpiredSessions } from './get-expired-sessions';
import { deleteSession } from './delete-session';
import { ensureSession } from './ensure-session';
import { addFile } from './add-file';
import { addOutputFile } from './add-output-file';
import { getFile } from './get-file';
import { getFiles } from './get-files';
import { getFilesByIds } from './get-files-by-ids';
import { deleteFile } from './delete-file';
import { downloadToTempFile } from './download-to-temp';
import { streamToResponse } from './stream-to-response';
import { updateFileContent } from './update-file-content';
import { renameFile } from './rename-file';
import type { ManagedFile, FileSession } from './types';

const log = logger.child({ service: 'file-manager' });

class FileManager {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private objectStorage: ObjectStorageService | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    await fs.mkdir(UPLOADS_BASE, { recursive: true });

    try {
      this.objectStorage = getObjectStorage();
      log.info('Using Replit Object Storage for persistence');
    } catch (e) {
      log.info('Object storage not available, using local disk only');
    }

    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
    log.info('FileManager initialized');
  }

  private async cleanupExpiredSessions() {
    try {
      const expired = await getExpiredSessions();
      for (const session of expired) {
        await this.destroySession(session.id);
      }
    } catch (e) {
      log.error('Error cleaning up expired sessions', { error: e });
    }
  }

  async createSession(): Promise<string> {
    const { createSession } = await import('./create-session');
    return createSession();
  }

  async getSession(sessionId: string): Promise<FileSession | undefined> {
    const { getSession } = await import('./get-session');
    return getSession(sessionId);
  }

  async ensureSession(sessionId: string): Promise<FileSession> {
    return ensureSession(sessionId);
  }

  async destroySession(sessionId: string): Promise<void> {
    const files = await this.getFiles(sessionId);
    for (const file of files) {
      await this.deleteFile(sessionId, file.id);
    }
    await deleteSession(sessionId);
  }

  async addFile(sessionId: string, originalName: string, tempPath: string, size: number, mimeType: string): Promise<ManagedFile> {
    return addFile(sessionId, originalName, tempPath, size, mimeType, this.objectStorage);
  }

  async addOutputFile(sessionId: string, originalName: string, sourcePath: string, outputType: 'epub' | 'pdf' | 'compressed' | 'html' | 'xhtml' | 'docx' | 'zip'): Promise<ManagedFile> {
    return addOutputFile(sessionId, originalName, sourcePath, outputType, this.objectStorage);
  }

  async getFile(sessionId: string, fileId: string): Promise<ManagedFile | undefined> {
    return getFile(sessionId, fileId);
  }

  async getFiles(sessionId: string): Promise<ManagedFile[]> {
    return getFiles(sessionId);
  }

  async getFilesByIds(sessionId: string, fileIds: string[]): Promise<ManagedFile[]> {
    return getFilesByIds(sessionId, fileIds);
  }

  async deleteFile(sessionId: string, fileId: string): Promise<boolean> {
    return deleteFile(sessionId, fileId, this.objectStorage);
  }

  async clearSession(sessionId: string): Promise<void> {
    const files = await this.getFiles(sessionId);
    for (const file of files) await this.deleteFile(sessionId, file.id);
    log.debug('Cleared all files from session', { sessionId });
  }

  async downloadToTempFile(sessionId: string, fileId: string): Promise<string> {
    return downloadToTempFile(sessionId, fileId, this.objectStorage);
  }

  async streamToResponse(sessionId: string, fileId: string, res: any, inline: boolean = false): Promise<void> {
    return streamToResponse(sessionId, fileId, res, inline, this.objectStorage);
  }

  async updateFileContent(sessionId: string, fileId: string, content: string): Promise<ManagedFile> {
    return updateFileContent(sessionId, fileId, content, this.objectStorage);
  }

  async renameFile(sessionId: string, fileId: string, newName: string): Promise<ManagedFile> {
    return renameFile(sessionId, fileId, newName);
  }

  shutdown() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    log.info('FileManager shutting down');
  }
}

export const fileManager = new FileManager();
