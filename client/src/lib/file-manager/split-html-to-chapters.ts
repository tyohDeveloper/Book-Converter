import { getHeaders } from '../session';
import type { SplitHtmlSettings, SplitHtmlResult } from './types';

export async function splitHtmlToChapters(
  fileId: string,
  settings?: SplitHtmlSettings,
  signal?: AbortSignal
): Promise<SplitHtmlResult> {
  const response = await fetch('/api/tools/split-html', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileId, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to split HTML' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
