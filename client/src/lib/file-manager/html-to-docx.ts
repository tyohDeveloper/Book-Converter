import { getHeaders } from '../session';
import type { HtmlToDocxSettings, HtmlToDocxResult } from './types';

export async function convertHtmlToDocx(
  fileIds: string[], 
  settings?: HtmlToDocxSettings,
  signal?: AbortSignal
): Promise<HtmlToDocxResult> {
  const response = await fetch('/api/tools/convert-html-to-docx', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to convert HTML to DOCX' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
