import { decodeGlyph } from "./decode-glyph";

export function decodeGlyphArray(arr: any[]): string {
  let result = '';
  for (const item of arr) {
    if (typeof item === 'number') {
      if (item < -100) result += ' ';
    } else if (Array.isArray(item)) {
      result += item.map(decodeGlyph).join('');
    } else {
      result += decodeGlyph(item);
    }
  }
  return result;
}
