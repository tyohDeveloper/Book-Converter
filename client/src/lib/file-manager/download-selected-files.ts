import { getHeaders } from '../session';

export async function downloadSelectedFiles(
  fileIds: string[], 
  options?: { stripTimestamps?: boolean }
): Promise<void> {
  const response = await fetch('/api/files/download-batch', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      fileIds, 
      stripTimestamps: options?.stripTimestamps ?? false 
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to download files' }));
    throw new Error(error.details || error.error);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = fileIds.length === 1 ? 'download' : 'digital-bindery-files.zip';
  
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) {
      filename = match[1];
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
