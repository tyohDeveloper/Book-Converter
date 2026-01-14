import { getHeaders } from '../../session';
import type { CssStylesResult } from './types';

export async function getCssStyles(fileId: string, signal?: AbortSignal): Promise<CssStylesResult> {
  const response = await fetch('/api/tools/html-css', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get CSS styles' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
