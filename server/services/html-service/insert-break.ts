import { textPosToHtmlIndex } from "./cursor-utils";

export function insertBreakAtPosition(
  el: Element,
  position: number,
  doc: Document
): void {
  const text = el.textContent || "";
  if (position <= 0 || position >= text.length) return;

  const html = el.innerHTML;
  const insertIndex = textPosToHtmlIndex(html, position);
  if (insertIndex < 0) return;

  const beforeHtml = html.substring(0, insertIndex);
  const afterHtml = html.substring(insertIndex);

  el.innerHTML = beforeHtml + "<br>" + afterHtml;
}
