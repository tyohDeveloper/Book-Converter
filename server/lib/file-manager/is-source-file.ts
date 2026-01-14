import { SUPPORTED_SOURCE_EXTENSIONS } from './types';

export function isSourceFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUPPORTED_SOURCE_EXTENSIONS.includes(ext);
}
