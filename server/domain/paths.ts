import path from 'path';
import crypto from 'crypto';

export const UPLOADS_BASE = path.join(process.cwd(), 'uploads');

export function getTempFilePath(prefix: string, ext: string = 'txt'): string {
  const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return path.join(UPLOADS_BASE, `${prefix}-${uniqueId}.${ext}`);
}

export function getSessionDir(sessionId: string): string {
  return path.join(UPLOADS_BASE, `session-${sessionId}`);
}
