import { buildXhtml } from "../../lib/xhtml/build-xhtml";

export function buildHtmlDocument(title: string, bodyContent: string, styles: string[], skipCss = false): string {
  return buildXhtml({
    title,
    content: bodyContent,
    styles: { inline: styles },
    skipCss,
    normalizeContent: true,
  });
}
