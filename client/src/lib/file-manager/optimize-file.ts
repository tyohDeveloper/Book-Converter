import { getHeaders } from '../session';
import type { OptimizeResult, ProgressUpdate } from './types';

export async function optimizeFile(
  fileId: string, 
  onProgress?: (progress: ProgressUpdate) => void,
  signal?: AbortSignal
): Promise<OptimizeResult> {
  const response = await fetch('/api/tools/optimize', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds: [fileId] }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to optimize file' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  
  if (!data.operationId) {
    return data;
  }

  const operationId = data.operationId;
  
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`/api/progress/${operationId}`);
    
    const cleanup = async (shouldCancel: boolean = false) => {
      eventSource.close();
      
      if (shouldCancel) {
        try {
          await fetch(`/api/progress/${operationId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
        } catch (e) {
          // Ignore cancel errors
        }
      }
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        cleanup(true);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'progress') {
          onProgress?.({
            stage: message.stage,
            percent: message.percent,
            message: message.message
          });
        } else if (message.type === 'complete') {
          cleanup(false);
          if (message.success) {
            resolve(message.result);
          } else {
            reject(new Error(message.error || 'Operation failed'));
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      cleanup(false);
      reject(new Error('Connection lost'));
    };
  });
}
