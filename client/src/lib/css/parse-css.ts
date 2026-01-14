import { getHeaders } from '../session';
import type { ParsedStylesheet } from '@shared/contracts/css-editor';

export async function parseCss(css: string): Promise<ParsedStylesheet> {
  const response = await fetch('/api/css/parse', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ css })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to parse CSS' }));
    throw new Error(error.details || error.error);
  }
  return (await response.json()).parsed;
}
