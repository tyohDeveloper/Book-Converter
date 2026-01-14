import { getHeaders } from '../session';
import type { BundleHtmlSettings, BundleHtmlResult } from './types';

export async function bundleHtmlFiles(
  fileIds: string[],
  settings?: BundleHtmlSettings,
  signal?: AbortSignal
): Promise<BundleHtmlResult> {
  const response = await fetch('/api/tools/bundle-html', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to bundle HTML files' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
