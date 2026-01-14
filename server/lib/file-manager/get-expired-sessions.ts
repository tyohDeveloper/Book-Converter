import { db } from '../../db';
import { sessions } from '@shared/schema';
import { lt } from 'drizzle-orm';
import { SESSION_TTL } from './types';

export async function getExpiredSessions(): Promise<{ id: string }[]> {
  const cutoff = new Date(Date.now() - SESSION_TTL);
  return db.select({ id: sessions.id }).from(sessions).where(lt(sessions.lastAccessedAt, cutoff));
}
