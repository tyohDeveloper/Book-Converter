import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { db } from '../../db';
import { managedFiles, type InsertManagedFile } from '@shared/schema';
import type { ObjectStorageService } from '../object-storage/object-storage-service';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';
import { toManagedFile, type ManagedFile } from './types';
import { ensureSession } from './ensure-session';

const log = logger.child({ service: 'file-manager-add-file' });

export async function addFile(
  sessionId: string,
  originalName: string,
  tempPath: string,
  size: number,
  mimeType: string,
  objectStorage: ObjectStorageService | null
): Promise<ManagedFile> {
  await ensureSession(sessionId);

  const fileId = crypto.randomUUID();
  const ext = path.extname(originalName) || '.pdf';
  const storageKey = `${fileId}${ext}`;

  if (objectStorage) {
    await objectStorage.uploadFile(sessionId, storageKey, tempPath, mimeType);
    try { await fs.unlink(tempPath); } catch (e) { log.error('Failed to clean up temp file', { tempPath }); }
  } else {
    const sessionDir = path.join(UPLOADS_BASE, `session-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.rename(tempPath, path.join(sessionDir, storageKey));
  }

  const insertData: InsertManagedFile = {
    id: fileId, sessionId, originalName, storageKey, size, mimeType, isOutput: false, outputType: null,
  };

  const [dbFile] = await db.insert(managedFiles).values(insertData).returning();
  log.debug('Added file to session', { sessionId, originalName, fileId });
  return toManagedFile(dbFile);
}
