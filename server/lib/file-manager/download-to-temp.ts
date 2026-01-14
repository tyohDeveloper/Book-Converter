import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import type { ObjectStorageService } from '../object-storage/object-storage-service';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';
import { getFile } from './get-file';

const log = logger.child({ service: 'file-manager-download-to-temp' });

export async function downloadToTempFile(
  sessionId: string,
  fileId: string,
  objectStorage: ObjectStorageService | null
): Promise<string> {
  const file = await getFile(sessionId, fileId);
  if (!file) throw new Error(`File not found: ${fileId}`);

  const tempPath = path.join(UPLOADS_BASE, `temp-${crypto.randomUUID()}${path.extname(file.storageKey)}`);

  if (objectStorage) {
    await objectStorage.downloadToFile(sessionId, file.storageKey, tempPath);
  } else {
    await fs.copyFile(path.join(UPLOADS_BASE, `session-${sessionId}`, file.storageKey), tempPath);
  }

  return tempPath;
}
