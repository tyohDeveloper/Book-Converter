import { getHeaders } from '../session';
import type { OutputFileResult } from './types';

export interface CleanHtmlSettings {
  removeNullSpans?: boolean;
  removeWhitespaceStyles?: boolean;
  removeInterparagraphBr?: boolean;
  flattenNestedElements?: boolean;
  removeUndefinedClasses?: boolean;
}

export interface CleanHtmlStats {
  nullSpansRemoved: number;
  whitespaceStylesRemoved: number;
  brElementsRemoved: number;
  nestedElementsFlattened: number;
  undefinedClassesRemoved: number;
}

export interface CleanHtmlResult {
  success: boolean;
  file: OutputFileResult;
  stats: CleanHtmlStats;
}

export async function cleanHtml(
  fileId: string,
  settings?: CleanHtmlSettings,
  signal?: AbortSignal
): Promise<CleanHtmlResult> {
  const response = await fetch('/api/tools/html-clean', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileId, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to clean HTML' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
