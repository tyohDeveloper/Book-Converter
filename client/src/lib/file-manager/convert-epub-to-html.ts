import { getHeaders } from '../session';
import type { EpubToHtmlSettings, EpubConvertResult } from './types';

export async function convertEpubToHtml(
  fileIds: string[], 
  settings?: EpubToHtmlSettings,
  signal?: AbortSignal
): Promise<EpubConvertResult> {
  const response = await fetch('/api/tools/convert-epub', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to convert EPUB' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
