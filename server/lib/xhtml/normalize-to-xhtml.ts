import { normalizeVoidElements } from "./normalize-void-elements";

export function normalizeToXhtml(html: string): string {
  let result = html;
  result = normalizeVoidElements(result);
  result = result.replace(/<br\s*>/gi, "<br />");
  result = result.replace(/<hr\s*>/gi, "<hr />");
  result = result.replace(/<img([^>]*?)(?<!\/)>/gi, "<img$1 />");
  return result;
}
