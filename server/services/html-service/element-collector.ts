const FORMATTABLE_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "blockquote"];

export function collectFormattableElements(body: Element): Element[] {
  const elements: Element[] = [];
  const walker = body.ownerDocument!.createTreeWalker(body, 1, null);
  let node = walker.nextNode();
  
  while (node) {
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (FORMATTABLE_TAGS.includes(tag) && el.textContent?.trim()) {
      elements.push(el);
    }
    node = walker.nextNode();
  }
  
  return elements;
}

export function findPreviousFormattableElement(
  el: Element,
  formattable: Element[]
): Element | null {
  const idx = formattable.indexOf(el);
  if (idx <= 0) return null;
  return formattable[idx - 1];
}
