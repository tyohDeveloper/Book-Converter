import { decodeGlyph } from "./decode-glyph";
import { decodeGlyphArray } from "./decode-glyph-array";

export function extractTextFromArgs(opName: string, args: any[]): string | undefined {
  if (!args || args.length === 0) return undefined;

  if (opName === 'showText' || opName === 'showSpacedText') {
    const decoded = args.map(arg => {
      if (Array.isArray(arg)) return decodeGlyphArray(arg);
      return decodeGlyph(arg);
    }).join('');
    return decoded.length > 0 ? decoded : undefined;
  }
  return undefined;
}
