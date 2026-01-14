import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { db } from '../../db';
import { managedFiles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { ObjectStorageService } from '../object-storage/object-storage-service';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';
import { type ManagedFile } from './types';
import { getFile } from './get-file';

const log = logger.child({ service: 'file-manager-update-file-content' });

export async function updateFileContent(
  sessionId: string,
  fileId: string,
  content: string,
  objectStorage: ObjectStorageService | null
): Promise<ManagedFile> {
  const file = await getFile(sessionId, fileId);
  if (!file) throw new Error(`File not found: ${fileId}`);

  const tempPath = path.join(UPLOADS_BASE, `temp-${crypto.randomUUID()}${path.extname(file.storageKey)}`);
  await fs.writeFile(tempPath, content, 'utf-8');
  const stat = await fs.stat(tempPath);

  if (objectStorage) {
    await objectStorage.uploadFile(sessionId, file.storageKey, tempPath, file.mimeType);
    await fs.unlink(tempPath).catch(() => {});
  } else {
    const storagePath = path.join(UPLOADS_BASE, `session-${sessionId}`, file.storageKey);
    await fs.rename(tempPath, storagePath);
  }

  await db.update(managedFiles)
    .set({ size: stat.size })
    .where(and(eq(managedFiles.sessionId, sessionId), eq(managedFiles.id, fileId)));

  log.debug('Updated file content', { sessionId, fileId, newSize: stat.size });
  return { ...file, size: stat.size };
}
