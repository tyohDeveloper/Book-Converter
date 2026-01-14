export function mergeWithPreviousElement(el: Element, prev: Element): void {
  const prevContent = prev.innerHTML;
  const currentContent = el.innerHTML;
  prev.innerHTML = prevContent + " " + currentContent;
  el.remove();
}
