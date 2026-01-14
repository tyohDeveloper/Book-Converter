import { getHeaders } from '../session';
import type { ManagedFile } from './types';

export async function listFiles(): Promise<ManagedFile[]> {
  const response = await fetch('/api/files', {
    headers: getHeaders()
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.files || [];
}
