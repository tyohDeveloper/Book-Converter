import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

export interface FontInfo {
  name: string;
  type: string;
  embedded: boolean;
}

export function parseFontDict(
  pdfDoc: PDFDocument,
  nameObj: PDFName,
  fontRef: any
): FontInfo | null {
  try {
    const font = pdfDoc.context.lookup(fontRef);
    if (!(font instanceof PDFDict)) return null;

    const baseFont = font.get(PDFName.of('BaseFont'));
    const subtype = font.get(PDFName.of('Subtype'));
    const fontDescRef = font.get(PDFName.of('FontDescriptor'));

    const fontName = baseFont
      ? baseFont.toString().replace(/^\//, '')
      : nameObj.toString().replace(/^\//, '');

    let fontType = 'Unknown';
    if (subtype) {
      fontType = subtype.toString().replace(/^\//, '');
    }

    let embedded = false;
    if (fontDescRef) {
      const fontDesc = pdfDoc.context.lookup(fontDescRef);
      if (fontDesc instanceof PDFDict) {
        embedded = !!(
          fontDesc.get(PDFName.of('FontFile')) ||
          fontDesc.get(PDFName.of('FontFile2')) ||
          fontDesc.get(PDFName.of('FontFile3'))
        );
      }
    }

    return { name: fontName, type: fontType, embedded };
  } catch (e) {
    return null;
  }
}
