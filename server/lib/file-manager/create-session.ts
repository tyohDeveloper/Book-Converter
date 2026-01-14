import crypto from 'crypto';
import { db } from '../../db';
import { sessions } from '@shared/schema';
import { logger } from '../../common/logger';

const log = logger.child({ service: 'file-manager-session' });

export async function createSession(): Promise<string> {
  const sessionId = crypto.randomUUID();
  await db.insert(sessions).values({ id: sessionId });
  log.debug('Created session', { sessionId });
  return sessionId;
}
