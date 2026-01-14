import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

export function getPageResources(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument['getPages']>[0]
): PDFDict | null {
  try {
    const pageDict = page.node;
    const resourcesRef = pageDict.get(PDFName.of('Resources'));
    if (!resourcesRef) return null;

    const resources = pdfDoc.context.lookup(resourcesRef);
    if (!(resources instanceof PDFDict)) return null;

    return resources;
  } catch (e) {
    return null;
  }
}

export function getResourceDict(
  pdfDoc: PDFDocument,
  resources: PDFDict,
  resourceName: string
): PDFDict | null {
  try {
    const dictRef = resources.get(PDFName.of(resourceName));
    if (!dictRef) return null;

    const dict = pdfDoc.context.lookup(dictRef);
    if (!(dict instanceof PDFDict)) return null;

    return dict;
  } catch (e) {
    return null;
  }
}
