import { getHeaders } from '../session';
import type { PdfDesignRules } from '@shared/contracts/pdf-design-rules';

export interface HtmlToPdfSettings {
  title?: string;
  paperSize?: 'letter' | 'a4';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  designRules?: PdfDesignRules;
}

export interface OutputFile {
  id: string;
  name: string;
  size: number;
}

export interface HtmlToPdfResult {
  success: boolean;
  file?: OutputFile;
  files?: OutputFile[];
}

export async function convertHtmlToPdf(
  fileId: string, 
  settings?: HtmlToPdfSettings,
  signal?: AbortSignal
): Promise<HtmlToPdfResult> {
  return convertHtmlsToPdf([fileId], settings, signal);
}

export async function convertHtmlsToPdf(
  fileIds: string[], 
  settings?: HtmlToPdfSettings,
  signal?: AbortSignal
): Promise<HtmlToPdfResult> {
  const response = await fetch('/api/tools/html-to-pdf', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds, settings }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to convert HTML to PDF' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data;
}
