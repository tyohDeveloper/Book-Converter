import { db } from '../../db';
import { sessions } from '@shared/schema';
import type { FileSession } from './types';
import { getSession } from './get-session';
import { touchSession } from './touch-session';
import { logger } from '../../common/logger';

const log = logger.child({ service: 'file-manager-session' });

export async function ensureSession(sessionId: string): Promise<FileSession> {
  let session = await getSession(sessionId);

  if (!session) {
    await db.insert(sessions).values({ id: sessionId });
    session = {
      id: sessionId,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };
    log.debug('Auto-created session', { sessionId: sessionId.substring(0, 8) + '...' });
  } else {
    await touchSession(sessionId);
    log.debug('Touched existing session', { sessionId: sessionId.substring(0, 8) + '...' });
  }

  return session;
}
