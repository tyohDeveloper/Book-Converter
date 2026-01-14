export function isEpubFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.epub');
}
