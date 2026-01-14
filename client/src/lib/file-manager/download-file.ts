import { getHeaders } from '../session';

export async function downloadFile(fileId: string): Promise<void> {
  const response = await fetch(`/api/files/${fileId}/download`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to download file' }));
    throw new Error(error.details || error.error);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'download';
  
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
