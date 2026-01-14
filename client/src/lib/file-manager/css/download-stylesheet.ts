import { getHeaders } from '../../session';

export async function downloadStylesheet(
  fileId: string, 
  filename: string = 'stylesheet.css'
): Promise<void> {
  const response = await fetch('/api/tools/css/download', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, filename }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to download stylesheet' }));
    throw new Error(error.details || error.error);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  let downloadName = filename;

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) downloadName = match[1];
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function loadStylesheet(fileId: string): Promise<string> {
  const response = await fetch(`/api/files/${fileId}/content`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to load stylesheet' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data.content || '';
}

export interface MergeStylesheetResult {
  success: boolean;
  styles: string;
}

export async function mergeStylesheet(
  fileId: string, 
  cssFileId: string
): Promise<MergeStylesheetResult> {
  const response = await fetch('/api/tools/css/merge', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, cssFileId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to merge stylesheet' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
