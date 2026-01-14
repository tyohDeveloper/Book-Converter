function isWhitespaceTextNode(node: Node | null): boolean {
  return node?.nodeType === 3 && node.textContent?.trim() === "";
}

function isParagraphElement(node: Node | null): boolean {
  return node?.nodeType === 1 && (node as Element).tagName === "P";
}

export function removeInterparagraphBr(body: HTMLElement): number {
  let count = 0;
  const brElements = Array.from(body.querySelectorAll("br"));
  
  for (const br of brElements) {
    let prevSibling = br.previousSibling;
    while (prevSibling && isWhitespaceTextNode(prevSibling)) {
      prevSibling = prevSibling.previousSibling;
    }
    
    let nextSibling = br.nextSibling;
    while (nextSibling && isWhitespaceTextNode(nextSibling)) {
      nextSibling = nextSibling.nextSibling;
    }
    
    const afterParagraph = isParagraphElement(prevSibling);
    const beforeParagraph = isParagraphElement(nextSibling);
    
    if (afterParagraph && beforeParagraph) {
      br.parentNode?.removeChild(br);
      count++;
    }
  }
  
  return count;
}
