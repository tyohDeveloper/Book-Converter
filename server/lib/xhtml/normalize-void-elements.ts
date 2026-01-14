export function normalizeVoidElements(html: string): string {
  return html
    .replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*?)(?<!\/)>/gi,
      (_, tag, attrs) => `<${tag.toLowerCase()}${attrs} />`
    );
}
