import * as fs from 'fs/promises';
import * as path from 'path';
import { UPLOADS_BASE } from '../../domain/paths';
import { logger } from '../../common/logger';

const log = logger.child({ service: 'temp-cleanup' });

export async function cleanupStaleFiles(): Promise<void> {
  try {
    const files = await fs.readdir(UPLOADS_BASE);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    let cleaned = 0;
    for (const file of files) {
      const filePath = path.join(UPLOADS_BASE, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          cleaned++;
        }
      } catch (e) {
        // Ignore errors for individual files
      }
    }
    
    if (cleaned > 0) {
      log.info('Cleaned up stale temp files', { count: cleaned });
    }
  } catch (error: any) {
    log.error('Error cleaning up stale files', { error: error.message });
  }
}

export function startPeriodicCleanup(intervalMs: number = 60 * 60 * 1000): NodeJS.Timeout {
  return setInterval(cleanupStaleFiles, intervalMs);
}
