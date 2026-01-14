import { db } from '../../db';
import { sessions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { FileSession } from './types';

export async function getSession(sessionId: string): Promise<FileSession | undefined> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (session) {
    await db
      .update(sessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    return {
      id: session.id,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastAccessedAt,
    };
  }

  return undefined;
}
