import { db } from '../../db';
import { managedFiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../common/logger';
import { toManagedFile, type ManagedFile } from './types';
import { touchSession } from './touch-session';
import { naturalCompare } from '@shared/utils/natural-sort';

const log = logger.child({ service: 'file-manager-get-files' });

export async function getFiles(sessionId: string): Promise<ManagedFile[]> {
  await touchSession(sessionId);
  const dbFiles = await db.select().from(managedFiles).where(eq(managedFiles.sessionId, sessionId));
  const files = dbFiles.map(toManagedFile);
  return files.sort((a, b) => naturalCompare(a.originalName, b.originalName));
}
