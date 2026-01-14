import { getHeaders } from '../../session';
import type { MultiCssStylesResult } from './types';

export async function getMultiCssStyles(
  fileIds: string[],
  signal?: AbortSignal
): Promise<MultiCssStylesResult> {
  const response = await fetch('/api/tools/html-css-multi', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get CSS styles' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
