import { decodeGlyph } from "./decode-glyph";
import { decodeGlyphArray } from "./decode-glyph-array";

export function formatArg(arg: any): string {
  if (arg === null || arg === undefined) return 'null';
  if (typeof arg === 'string') return `"${arg}"`;
  if (typeof arg === 'number') return arg.toString();

  if (ArrayBuffer.isView(arg)) {
    const arr = Array.from(arg as Uint8Array);
    try {
      const text = arr.map(c => String.fromCharCode(c)).join('');
      if (/^[\x20-\x7E\n\r\t]+$/.test(text)) return `"${text}"`;
    } catch {}
    if (arr.length > 20) return `<bytes[${arr.length}]>`;
    return `<bytes: ${arr.join(',')}>`;
  }

  if (Array.isArray(arg)) {
    const decoded = decodeGlyphArray(arg);
    if (decoded.length > 0) return `"${decoded}"`;
    const formatted = arg.slice(0, 3).map(formatArg);
    if (arg.length > 3) return `[${formatted.join(', ')}... (${arg.length} items)]`;
    return `[${formatted.join(', ')}]`;
  }

  if (typeof arg === 'object') {
    if (arg.unicode) return `"${arg.unicode}"`;
    if (arg.name) return `/${arg.name}`;
    const keys = Object.keys(arg);
    if (keys.length > 3) return `{${keys.slice(0, 3).join(', ')}...}`;
    return `{${keys.join(', ')}}`;
  }

  return String(arg);
}
