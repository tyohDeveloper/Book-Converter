export function stripFileExtension(filename: string): string {
  return filename.replace(/\.(pdf|html|xhtml|htm)$/i, "").trim();
}
