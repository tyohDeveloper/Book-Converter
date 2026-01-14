export function rewriteInternalLinks(content: string, hrefToId: Map<string, string>): string {
  return content.replace(
    /href=["']([^"'#]+)(#[^"']*)?["']/gi,
    (match, href, hash) => {
      const targetId = hrefToId.get(href);
      if (targetId) {
        return `href="#${targetId}${hash || ''}"`;
      }
      if (href.endsWith('.xhtml') || href.endsWith('.html') || href.endsWith('.htm')) {
        return `href="#"`;
      }
      return match;
    }
  );
}
