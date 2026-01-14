import { escapeXML } from '../../domain/xml';

export function pagesToParagraphs(pages: { text: string }[]): string {
  return pages
    .map(page => {
      const paragraphs = page.text.split(/\n+/).filter(p => p.trim());
      return paragraphs
        .map(p => `<p>${escapeXML(p)}</p>`)
        .join('\n');
    })
    .join('\n');
}
