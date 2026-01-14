import { getHeaders } from '../session';
import type { StructureResult } from './types';

export async function analyzeStructure(fileIds: string[], signal?: AbortSignal): Promise<StructureResult[]> {
  const response = await fetch('/api/tools/structure', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to analyze structure' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data.results;
}
