export function changeElementTag(
  el: Element,
  newTag: string,
  doc: Document
): Element {
  const newEl = doc.createElement(newTag);
  newEl.innerHTML = el.innerHTML;
  const style = el.getAttribute("style");
  if (style) newEl.setAttribute("style", style);
  el.replaceWith(newEl);
  return newEl;
}
