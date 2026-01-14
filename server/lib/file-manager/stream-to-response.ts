import path from 'path';
import { createReadStream } from 'fs';
import type { ObjectStorageService } from '../object-storage/object-storage-service';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';
import { getFile } from './get-file';

const log = logger.child({ service: 'file-manager-stream-to-response' });

export async function streamToResponse(
  sessionId: string,
  fileId: string,
  res: any,
  inline: boolean,
  objectStorage: ObjectStorageService | null
): Promise<void> {
  const file = await getFile(sessionId, fileId);
  if (!file) throw new Error(`File not found: ${fileId}`);

  const disposition = inline ? 'inline' : 'attachment';

  if (objectStorage) {
    await objectStorage.streamToResponse(sessionId, file.storageKey, res, file.originalName, file.mimeType, inline);
  } else {
    const storagePath = path.join(UPLOADS_BASE, `session-${sessionId}`, file.storageKey);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.size);
    createReadStream(storagePath).pipe(res);
  }
}
