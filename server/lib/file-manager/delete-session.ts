import { db } from '../../db';
import { sessions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../common/logger';

const log = logger.child({ service: 'file-manager-session' });

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
  log.debug('Destroyed session', { sessionId });
}
