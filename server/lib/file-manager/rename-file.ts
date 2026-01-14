import { db } from '../../db';
import { managedFiles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../common/logger';
import { type ManagedFile } from './types';
import { getFile } from './get-file';
import { sanitizeFilename } from '@shared/utils/filenames';

const log = logger.child({ service: 'file-manager-rename-file' });

export async function renameFile(
  sessionId: string,
  fileId: string,
  newName: string
): Promise<ManagedFile> {
  const file = await getFile(sessionId, fileId);
  if (!file) throw new Error(`File not found: ${fileId}`);

  const trimmed = newName.trim();
  if (!trimmed) throw new Error("Invalid file name");
  const sanitized = sanitizeFilename(trimmed, { maxLength: 200 });

  await db.update(managedFiles)
    .set({ originalName: sanitized })
    .where(and(eq(managedFiles.sessionId, sessionId), eq(managedFiles.id, fileId)));

  log.debug('Renamed file', { sessionId, fileId, oldName: file.originalName, newName: sanitized });
  return { ...file, originalName: sanitized };
}
