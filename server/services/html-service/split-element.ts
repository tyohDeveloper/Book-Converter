import { textPosToHtmlIndex } from "./cursor-utils";

export function splitElementAtPosition(
  el: Element,
  position: number,
  doc: Document
): Element | null {
  const text = el.textContent || "";
  if (position <= 0 || position >= text.length) return null;

  const html = el.innerHTML;
  const splitIndex = textPosToHtmlIndex(html, position);
  if (splitIndex < 0) return null;

  const beforeHtml = html.substring(0, splitIndex);
  const afterHtml = html.substring(splitIndex);

  const tag = el.tagName.toLowerCase();
  const newEl = doc.createElement(tag);
  const style = el.getAttribute("style");
  if (style) newEl.setAttribute("style", style);

  el.innerHTML = beforeHtml;
  newEl.innerHTML = afterHtml;

  el.after(newEl);
  return newEl;
}
