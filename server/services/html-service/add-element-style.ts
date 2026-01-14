export function addElementStyle(el: Element, style: string): void {
  const existing = el.getAttribute("style") || "";
  const combined = existing ? `${existing}; ${style}` : style;
  el.setAttribute("style", combined);
}
