import { getHeaders } from '../session';
import type { ParsedStylesheet } from '@shared/contracts/css-editor';

export async function buildCss(parsed: ParsedStylesheet): Promise<string> {
  const response = await fetch('/api/css/build', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ parsed })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to build CSS' }));
    throw new Error(error.details || error.error);
  }
  return (await response.json()).css;
}
