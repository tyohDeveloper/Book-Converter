import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../common/logger';

const log = logger.child({ service: 'temp-cleanup' });

export interface CleanupTracker {
  operationId: string;
  files: Set<string>;
  cancelled: boolean;
}

class TempFileCleanup {
  private operations: Map<string, CleanupTracker> = new Map();
  
  startOperation(operationId: string): CleanupTracker {
    const tracker: CleanupTracker = {
      operationId,
      files: new Set(),
      cancelled: false
    };
    this.operations.set(operationId, tracker);
    return tracker;
  }
  
  trackFile(operationId: string, filePath: string) {
    const tracker = this.operations.get(operationId);
    if (tracker) {
      tracker.files.add(filePath);
    }
  }
  
  untrackFile(operationId: string, filePath: string) {
    const tracker = this.operations.get(operationId);
    if (tracker) {
      tracker.files.delete(filePath);
    }
  }
  
  markCancelled(operationId: string) {
    const tracker = this.operations.get(operationId);
    if (tracker) {
      tracker.cancelled = true;
    }
  }
  
  isCancelled(operationId: string): boolean {
    return this.operations.get(operationId)?.cancelled ?? false;
  }
  
  async cleanupOperation(operationId: string): Promise<void> {
    const tracker = this.operations.get(operationId);
    if (!tracker) return;
    
    const files = Array.from(tracker.files);
    log.debug('Cleaning up temp files for operation', { operationId, fileCount: files.length });
    
    for (const file of files) {
      await this.cleanupFile(file);
    }
    
    this.operations.delete(operationId);
  }
  
  async cleanupFile(filePath: string): Promise<void> {
    if (!filePath) return;
    
    try {
      await fs.unlink(filePath);
      log.debug('Cleaned up temp file', { file: path.basename(filePath) });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        log.error('Failed to cleanup temp file', { filePath, error: error.message });
      }
    }
  }
  
  async cleanupFiles(files: string[]): Promise<void> {
    for (const file of files) {
      await this.cleanupFile(file);
    }
  }
  
  getOperationFiles(operationId: string): string[] {
    const tracker = this.operations.get(operationId);
    return tracker ? Array.from(tracker.files) : [];
  }
  
  hasOperation(operationId: string): boolean {
    return this.operations.has(operationId);
  }
}

export const tempCleanup = new TempFileCleanup();
