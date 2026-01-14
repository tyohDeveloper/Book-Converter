import { Response } from 'express';
import { logger } from '../common/logger';

const log = logger.child({ module: "progress-manager" });

export interface ProgressUpdate {
  stage: string;
  percent: number;
  message: string;
  substage?: string;
}

interface ProgressClient {
  res: Response;
  lastUpdate: number;
  connected: boolean;
}

interface Operation {
  cancelled: boolean;
  cancelFn?: () => void;
}

class ProgressManager {
  private clients: Map<string, ProgressClient[]> = new Map();
  private progress: Map<string, ProgressUpdate> = new Map();
  private operations: Map<string, Operation> = new Map();
  
  startOperation(operationId: string) {
    this.operations.set(operationId, { cancelled: false });
  }
  
  setCancelFn(operationId: string, cancelFn: () => void) {
    const op = this.operations.get(operationId);
    if (op) {
      op.cancelFn = cancelFn;
      // If already cancelled, call the cancel function immediately
      if (op.cancelled) {
        try {
          cancelFn();
        } catch (e: any) {
          log.error("error calling deferred cancel function", { operationId, error: e.message });
        }
      }
    }
  }
  
  isCancelled(operationId: string): boolean {
    return this.operations.get(operationId)?.cancelled ?? false;
  }
  
  cancelOperation(operationId: string) {
    const op = this.operations.get(operationId);
    if (op && !op.cancelled) {
      op.cancelled = true;
      
      // Try to call cancel function if registered
      if (op.cancelFn) {
        try {
          op.cancelFn();
        } catch (e: any) {
          log.error("error calling cancel function", { operationId, error: e.message });
        }
      }
      
      // Send cancelled message to all clients
      const clients = this.clients.get(operationId);
      if (clients) {
        for (const client of clients) {
          if (client.connected) {
            try {
              const data = { type: 'complete', success: false, error: 'Operation cancelled' };
              client.res.write(`data: ${JSON.stringify(data)}\n\n`);
              client.res.end();
            } catch (e) {
              // Client disconnected
            }
          }
        }
        this.clients.delete(operationId);
      }
      
      // Note: Don't call cleanup() here - let the background task do it
      // after it checks isCancelled() and exits gracefully
    }
  }
  
  // Called by background task when it finishes (success, error, or cancelled)
  finishOperation(operationId: string) {
    this.cleanup(operationId);
  }
  
  addClient(operationId: string, res: Response) {
    if (!this.clients.has(operationId)) {
      this.clients.set(operationId, []);
    }
    
    const client: ProgressClient = { res, lastUpdate: 0, connected: true };
    this.clients.get(operationId)!.push(client);
    
    const currentProgress = this.progress.get(operationId);
    if (currentProgress) {
      this.sendToClient(client, currentProgress);
    }
  }
  
  removeClient(operationId: string, res: Response) {
    const clients = this.clients.get(operationId);
    if (clients) {
      const client = clients.find(c => c.res === res);
      if (client) {
        client.connected = false;
      }
      const index = clients.findIndex(c => c.res === res);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    }
  }
  
  update(operationId: string, update: ProgressUpdate) {
    this.progress.set(operationId, update);
    
    const clients = this.clients.get(operationId);
    if (clients) {
      for (const client of clients) {
        if (client.connected) {
          this.sendToClient(client, update);
          client.lastUpdate = Date.now();
        }
      }
    }
  }
  
  complete(operationId: string, success: boolean, result?: any, error?: string) {
    // Send 100% progress update first
    this.update(operationId, {
      stage: success ? 'complete' : 'error',
      percent: 100,
      message: success ? 'Complete!' : (error || 'Operation failed')
    });
    
    const clients = this.clients.get(operationId);
    if (clients) {
      for (const client of clients) {
        if (client.connected) {
          try {
            const data = { type: 'complete', success, result, error };
            client.res.write(`data: ${JSON.stringify(data)}\n\n`);
            client.res.end();
          } catch (e) {
            // Client disconnected, ignore write error
          }
        }
      }
    }
    
    this.cleanup(operationId);
  }
  
  private cleanup(operationId: string) {
    this.clients.delete(operationId);
    this.progress.delete(operationId);
    this.operations.delete(operationId);
  }
  
  private sendToClient(client: ProgressClient, update: ProgressUpdate) {
    if (!client.connected) return;
    
    try {
      const data = { type: 'progress', ...update };
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // Client disconnected
      client.connected = false;
    }
  }
  
  hasOperation(operationId: string): boolean {
    return this.operations.has(operationId);
  }
}

export const progressManager = new ProgressManager();
