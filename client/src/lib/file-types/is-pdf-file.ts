export function isPdfFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf');
}
