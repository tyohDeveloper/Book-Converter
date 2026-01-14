import { getHeaders } from '../session';
import type { AnalyzeResult } from './types';

export async function analyzeFiles(fileIds: string[], detectChapters: boolean = true, signal?: AbortSignal): Promise<AnalyzeResult[]> {
  const response = await fetch('/api/tools/analyze', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds, detectChapters }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to analyze files' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data.results;
}
