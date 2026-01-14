export function textPosToHtmlIndex(html: string, textPos: number): number {
  let charCount = 0;
  let inTag = false;
  
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '<') {
      inTag = true;
    } else if (html[i] === '>') {
      inTag = false;
    } else if (!inTag) {
      if (charCount === textPos) {
        return i;
      }
      charCount++;
    }
  }
  
  return charCount === textPos ? html.length : -1;
}

export function textRangeToHtmlIndices(
  html: string,
  start: number,
  end: number
): { startIndex: number; endIndex: number } | null {
  let charCount = 0;
  let startIndex = -1;
  let endIndex = -1;
  let inTag = false;
  
  for (let i = 0; i < html.length && endIndex < 0; i++) {
    if (html[i] === '<') {
      inTag = true;
    } else if (html[i] === '>') {
      inTag = false;
    } else if (!inTag) {
      if (charCount === start && startIndex < 0) {
        startIndex = i;
      }
      charCount++;
      if (charCount === end) {
        endIndex = i + 1;
      }
    }
  }
  
  if (startIndex < 0 || endIndex < 0) return null;
  return { startIndex, endIndex };
}
