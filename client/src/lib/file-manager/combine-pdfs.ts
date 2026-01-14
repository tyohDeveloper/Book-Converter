import { getHeaders } from '../session';
import type { CombineResult } from './types';

export async function combinePdfs(fileIds: string[], outputName: string = 'combined.pdf', signal?: AbortSignal): Promise<CombineResult> {
  const response = await fetch('/api/tools/combine', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds, outputName }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to combine PDFs' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
