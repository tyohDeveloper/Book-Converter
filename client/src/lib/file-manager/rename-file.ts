import { getHeaders } from '../session';
import type { ManagedFile } from './types';

export async function renameFile(fileId: string, newName: string): Promise<ManagedFile> {
  const response = await fetch(`/api/files/${fileId}/rename`, {
    method: 'PATCH',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: newName })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to rename file' }));
    throw new Error(error.details || error.error);
  }

  const data = await response.json();
  return data.file;
}
