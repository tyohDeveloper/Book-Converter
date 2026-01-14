import { getHeaders } from '../../session';
import type { CssUpdateResult } from './types';

export async function updateCssStyles(fileId: string, styles: string, signal?: AbortSignal): Promise<CssUpdateResult> {
  const response = await fetch('/api/tools/html-css/update', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, styles }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update CSS styles' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
