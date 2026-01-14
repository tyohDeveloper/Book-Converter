import { textRangeToHtmlIndices } from "./cursor-utils";

export function wrapTextRange(
  el: Element,
  start: number,
  end: number,
  wrapKind: string,
  wrapStyle: string | undefined,
  doc: Document
): void {
  const text = el.textContent || "";
  if (start < 0 || end > text.length || start >= end) return;

  const html = el.innerHTML;
  const indices = textRangeToHtmlIndices(html, start, end);
  if (!indices) return;

  const { startIndex, endIndex } = indices;
  const tagName = wrapKind === "b" ? "b" : wrapKind === "em" ? "em" : "span";
  const styleAttr = wrapStyle && wrapKind === "span" ? ` style="${wrapStyle}"` : "";

  const beforeHtml = html.substring(0, startIndex);
  const selectedHtml = html.substring(startIndex, endIndex);
  const afterHtml = html.substring(endIndex);

  el.innerHTML = beforeHtml + `<${tagName}${styleAttr}>` + selectedHtml + `</${tagName}>` + afterHtml;
}
