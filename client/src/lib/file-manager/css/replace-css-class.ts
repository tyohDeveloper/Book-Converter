import { getHeaders } from '../../session';
import type { ReplaceClassResult } from './types';

export async function replaceCssClass(
  fileId: string, 
  sourceClass: string, 
  targetClass: string, 
  signal?: AbortSignal
): Promise<ReplaceClassResult> {
  const response = await fetch('/api/tools/html-css/replace-class', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, sourceClass, targetClass }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to replace CSS class' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
