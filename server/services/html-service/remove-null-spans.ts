export function removeNullSpans(body: HTMLElement): number {
  let count = 0;
  const spans = Array.from(body.querySelectorAll("span"));
  
  for (const span of spans) {
    if (span.attributes.length === 0) {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        count++;
      }
    }
  }
  
  return count;
}
