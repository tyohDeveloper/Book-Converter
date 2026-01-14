import { getHeaders } from '../../session';

export interface CssFileUpdateResult {
  success: boolean;
  files: { id: string; name: string; size: number }[];
}

export async function updateCssFileStyles(
  fileIds: string[],
  styles: string,
  signal?: AbortSignal
): Promise<CssFileUpdateResult> {
  const response = await fetch('/api/tools/css-file/update', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds, styles }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update CSS styles' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
