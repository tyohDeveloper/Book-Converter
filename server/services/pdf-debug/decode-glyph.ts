export function decodeGlyph(glyph: any): string {
  if (typeof glyph === 'string') return glyph;
  if (typeof glyph === 'number') return '';
  if (glyph && typeof glyph === 'object') {
    if (glyph.unicode) return glyph.unicode;
    if (glyph.fontChar) return glyph.fontChar;
    if (typeof glyph.originalCharCode === 'number') {
      return String.fromCharCode(glyph.originalCharCode);
    }
  }
  return '';
}
