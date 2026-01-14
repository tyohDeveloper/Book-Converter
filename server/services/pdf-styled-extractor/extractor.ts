import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import type { StyledTextResult, StyledPage, RawTextItem } from "./types";
import { detectFontStyle } from "./font-style-detector";
import { groupItemsIntoLines } from "./line-grouper";

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return "str" in item && typeof item.str === "string";
}

export async function extractStyledText(pdfPath: string): Promise<StyledTextResult> {
  const loadingTask = getDocument({
    url: pdfPath,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  });
  
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: StyledPage[] = [];
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    
    const fontStyleMap = new Map<string, { isItalic: boolean; isBold: boolean }>();
    if (textContent.styles) {
      for (const [fontId, style] of Object.entries(textContent.styles)) {
        const styleObj = style as Record<string, any>;
        const isItalic = styleObj.fontFamily?.toLowerCase().includes('italic') ||
                         styleObj.fontFamily?.toLowerCase().endsWith('it') ||
                         fontId.toLowerCase().includes('italic') ||
                         fontId.toLowerCase().endsWith('it') ||
                         /f2$/i.test(fontId);
        const isBold = styleObj.fontFamily?.toLowerCase().includes('bold') ||
                       fontId.toLowerCase().includes('bold');
        fontStyleMap.set(fontId, { isItalic, isBold });
      }
    }
    
    const items: RawTextItem[] = [];
    
    for (const item of textContent.items) {
      if (isTextItem(item) && item.str.length > 0) {
        const cachedStyle = fontStyleMap.get(item.fontName);
        const { isItalic, isBold } = cachedStyle || detectFontStyle(item.fontName);
        const transform = item.transform;
        items.push({
          text: item.str,
          x: transform[4],
          y: viewport.height - transform[5],
          isItalic,
          isBold,
          hasEOL: (item as any).hasEOL === true,
        });
      }
    }
    
    const lines = groupItemsIntoLines(items);
    pages.push({ pageNumber: pageNum, lines });
  }
  
  await pdf.destroy();
  return { pages, numPages };
}
