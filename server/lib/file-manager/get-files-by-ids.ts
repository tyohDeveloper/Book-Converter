import { logger } from '../../common/logger';
import { type ManagedFile } from './types';
import { touchSession } from './touch-session';
import { getFile } from './get-file';
import { naturalCompare } from '@shared/utils/natural-sort';

const log = logger.child({ service: 'file-manager-get-files-by-ids' });

export async function getFilesByIds(sessionId: string, fileIds: string[]): Promise<ManagedFile[]> {
  await touchSession(sessionId);
  const files: ManagedFile[] = [];
  for (const fileId of fileIds) {
    const file = await getFile(sessionId, fileId);
    if (file) files.push(file);
  }
  return files.sort((a, b) => naturalCompare(a.originalName, b.originalName));
}
