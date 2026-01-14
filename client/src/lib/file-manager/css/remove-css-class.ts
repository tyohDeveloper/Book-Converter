import { getHeaders } from '../../session';
import type { RemoveClassResult } from './types';

export async function removeCssClass(fileId: string, className: string, signal?: AbortSignal): Promise<RemoveClassResult> {
  const response = await fetch('/api/tools/html-css/remove-class', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, className }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove CSS class' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
