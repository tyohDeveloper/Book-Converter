import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { db } from '../../db';
import { managedFiles, type InsertManagedFile } from '@shared/schema';
import type { ObjectStorageService } from '../object-storage/object-storage-service';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';
import { toManagedFile, MIME_TYPES, FILE_EXTENSIONS, type ManagedFile } from './types';
import { ensureSession } from './ensure-session';

const log = logger.child({ service: 'file-manager-add-output-file' });

export async function addOutputFile(
  sessionId: string,
  originalName: string,
  sourcePath: string,
  outputType: 'epub' | 'pdf' | 'compressed' | 'html' | 'xhtml' | 'docx' | 'zip',
  objectStorage: ObjectStorageService | null
): Promise<ManagedFile> {
  await ensureSession(sessionId);

  const fileId = crypto.randomUUID();
  const ext = path.extname(originalName) || FILE_EXTENSIONS[outputType] || '.bin';
  const storageKey = `${fileId}${ext}`;
  const mimeType = MIME_TYPES[outputType] || 'application/octet-stream';
  const stat = await fs.stat(sourcePath);

  if (objectStorage) {
    await objectStorage.uploadFile(sessionId, storageKey, sourcePath, mimeType);
  } else {
    const sessionDir = path.join(UPLOADS_BASE, `session-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.copyFile(sourcePath, path.join(sessionDir, storageKey));
  }

  const insertData: InsertManagedFile = {
    id: fileId, sessionId, originalName, storageKey, size: stat.size, mimeType, isOutput: true, outputType,
  };

  const [dbFile] = await db.insert(managedFiles).values(insertData).returning();
  log.debug('Added output file to session', { sessionId, originalName, fileId });
  return toManagedFile(dbFile);
}
