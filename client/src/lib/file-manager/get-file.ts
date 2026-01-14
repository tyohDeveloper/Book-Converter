import { listFiles } from './list-files';
import type { ManagedFile } from './types';

export async function getFile(fileId: string): Promise<ManagedFile | null> {
  const files = await listFiles();
  return files.find(f => f.id === fileId) || null;
}
