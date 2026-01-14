import { getHeaders } from '../session';
import type { SplitEpubSettings, SplitEpubResult } from './types';

export async function splitEpubToChapters(
  fileId: string,
  settings?: SplitEpubSettings,
  signal?: AbortSignal
): Promise<SplitEpubResult> {
  const response = await fetch('/api/tools/split-epub', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileId, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to split EPUB' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
