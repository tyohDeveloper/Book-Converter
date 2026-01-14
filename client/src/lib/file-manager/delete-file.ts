import { getHeaders } from '../session';

export async function deleteFile(fileId: string): Promise<boolean> {
  const response = await fetch(`/api/files/${fileId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  return response.ok;
}
