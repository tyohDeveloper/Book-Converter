import { getHeaders } from '../session';
import type { DocxConversionSettings, DocxConvertResult } from './types';

export async function convertDocx(
  fileIds: string[], 
  outputFormat: 'html' | 'epub' | 'pdf',
  settings?: DocxConversionSettings,
  signal?: AbortSignal
): Promise<DocxConvertResult> {
  const response = await fetch('/api/tools/convert-docx', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds, outputFormat, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to convert DOCX' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
