import { getHeaders } from '../../session';
import type { MultiCssUpdateResult } from './types';

export async function updateMultiCssStyles(
  fileIds: string[],
  styles: string,
  signal?: AbortSignal
): Promise<MultiCssUpdateResult> {
  const response = await fetch('/api/tools/html-css-multi/update', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds, styles }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update CSS styles' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
