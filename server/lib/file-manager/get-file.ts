import { db } from '../../db';
import { managedFiles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../common/logger';
import { toManagedFile, type ManagedFile } from './types';
import { touchSession } from './touch-session';

const log = logger.child({ service: 'file-manager-get-file' });

export async function getFile(sessionId: string, fileId: string): Promise<ManagedFile | undefined> {
  await touchSession(sessionId);

  const [dbFile] = await db
    .select()
    .from(managedFiles)
    .where(and(eq(managedFiles.sessionId, sessionId), eq(managedFiles.id, fileId)))
    .limit(1);

  return dbFile ? toManagedFile(dbFile) : undefined;
}
