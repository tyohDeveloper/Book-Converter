import { getHeaders } from '../session';

export async function clearAllFiles(): Promise<boolean> {
  const response = await fetch('/api/files', {
    method: 'DELETE',
    headers: getHeaders()
  });

  return response.ok;
}
