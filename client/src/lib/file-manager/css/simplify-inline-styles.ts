import { getHeaders } from '../../session';
import type { SimplifyInlineResult } from './types';

export async function simplifyInlineStyles(fileId: string, signal?: AbortSignal): Promise<SimplifyInlineResult> {
  const response = await fetch('/api/tools/html-css/simplify', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to simplify inline styles' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
