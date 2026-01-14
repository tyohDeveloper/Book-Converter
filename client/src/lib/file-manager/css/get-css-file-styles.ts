import { getHeaders } from '../../session';
import type { CssStylesResult } from './types';

export async function getCssFileStyles(
  fileIds: string[],
  signal?: AbortSignal
): Promise<CssStylesResult & { files: { id: string; name: string; size: number }[] }> {
  const response = await fetch('/api/tools/css-file', {
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
