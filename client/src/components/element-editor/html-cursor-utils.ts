export function htmlPosToTextPos(htmlContent: string, htmlPos: number): number {
  let textPos = 0;
  let inTag = false;
  for (let i = 0; i < htmlPos && i < htmlContent.length; i++) {
    if (htmlContent[i] === '<') {
      inTag = true;
    } else if (htmlContent[i] === '>') {
      inTag = false;
    } else if (!inTag) {
      textPos++;
    }
  }
  return textPos;
}
