import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

export const OPS_NAMES: Record<number, string> = {};
for (const [name, code] of Object.entries(OPS)) {
  if (typeof code === 'number') {
    OPS_NAMES[code] = name;
  }
}
