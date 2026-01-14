import path from 'path';
import fs from 'fs/promises';
import { db } from '../../db';
import { managedFiles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { ObjectStorageService } from '../object-storage/object-storage-service';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';
import { getFile } from './get-file';

const log = logger.child({ service: 'file-manager-delete-file' });

export async function deleteFile(
  sessionId: string,
  fileId: string,
  objectStorage: ObjectStorageService | null
): Promise<boolean> {
  const file = await getFile(sessionId, fileId);
  if (!file) return false;

  if (objectStorage) {
    try { await objectStorage.deleteFile(sessionId, file.storageKey); }
    catch (e) { log.error('Failed to delete file from object storage', { storageKey: file.storageKey }); }
  } else {
    const storagePath = path.join(UPLOADS_BASE, `session-${sessionId}`, file.storageKey);
    try { await fs.unlink(storagePath); }
    catch (e) { log.error('Failed to delete file from disk', { storagePath }); }
  }

  await db.delete(managedFiles).where(and(eq(managedFiles.sessionId, sessionId), eq(managedFiles.id, fileId)));
  log.debug('Deleted file from session', { sessionId, originalName: file.originalName, fileId });
  return true;
}
