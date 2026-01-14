import { getHeaders } from '../../session';
import type { RemoveClassesResult } from './types';

export async function removeCssClasses(fileId: string, classNames: string[], signal?: AbortSignal): Promise<RemoveClassesResult> {
  const response = await fetch('/api/tools/html-css/remove-classes', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, classNames }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove CSS classes' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
