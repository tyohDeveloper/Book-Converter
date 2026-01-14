import { db } from '../../db';
import { sessions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function touchSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ lastAccessedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}
