import type { StyledLine, StyledTextSpan, RawTextItem } from "./types";

export function groupItemsIntoLines(items: RawTextItem[]): StyledLine[] {
  if (items.length === 0) return [];
  
  const lines: StyledLine[] = [];
  let currentSpans: StyledTextSpan[] = [];
  let currentBaselineY = items[0].y;
  const lineThreshold = 8;
  
  for (const item of items) {
    const isNewLine = currentSpans.length > 0 && Math.abs(item.y - currentBaselineY) > lineThreshold;
    
    if (isNewLine) {
      lines.push({ spans: currentSpans, baselineY: currentBaselineY });
      currentSpans = [];
      currentBaselineY = item.y;
    }
    
    if (currentSpans.length === 0) {
      currentBaselineY = item.y;
    }
    
    const lastSpan = currentSpans[currentSpans.length - 1];
    if (lastSpan && lastSpan.isItalic === item.isItalic && lastSpan.isBold === item.isBold) {
      lastSpan.text += item.text;
    } else {
      currentSpans.push({ text: item.text, isItalic: item.isItalic, isBold: item.isBold });
    }
    
    if (item.hasEOL && currentSpans.length > 0) {
      lines.push({ spans: currentSpans, baselineY: currentBaselineY });
      currentSpans = [];
    }
  }
  
  if (currentSpans.length > 0) {
    lines.push({ spans: currentSpans, baselineY: currentBaselineY });
  }
  
  return lines;
}
