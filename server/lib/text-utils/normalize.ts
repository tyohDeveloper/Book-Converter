export function normalizeForComparison(text: string): string {
  return text
    .replace(/\.(xhtml|html|htm|epub|pdf|docx?)$/i, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^\d+\.\s*/, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripDuplicateFirstHtmlElement(bodyContent: string, fileName: string): string {
  const textMatch = bodyContent.match(/<(?:p|h[1-6])[^>]*>([\s\S]*?)<\/(?:p|h[1-6])>/i);
  if (!textMatch) return bodyContent;
  
  const firstTagText = textMatch[1].replace(/<[^>]+>/g, '').trim();
  if (!firstTagText) return bodyContent;
  
  const normalizedFirst = normalizeForComparison(firstTagText);
  const normalizedName = normalizeForComparison(fileName);
  
  if (normalizedFirst === normalizedName) {
    return bodyContent.replace(textMatch[0], '').trimStart();
  }
  
  if (normalizedFirst.startsWith(normalizedName + ' ')) {
    const tagMatch = textMatch[0].match(/^<(p|h[1-6])([^>]*)>/i);
    if (tagMatch) {
      const tagName = tagMatch[1];
      const attrs = tagMatch[2];
      const innerContent = textMatch[1];
      
      const plainPrefix = fileName.replace(/[^a-zA-Z0-9\s]/g, '');
      const escapedPrefix = plainPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixPattern = new RegExp(`^\\s*${escapedPrefix}\\s*`, 'i');
      
      let newInner = innerContent.replace(prefixPattern, '');
      newInner = newInner.replace(/^(<[^>]+>)\s+/g, '$1');
      
      if (newInner.trim()) {
        const newTag = `<${tagName}${attrs}>${newInner}</${tagName}>`;
        return bodyContent.replace(textMatch[0], newTag);
      }
    }
  }
  
  return bodyContent;
}

export interface ProcessedPageLike {
  text: string;
  styledHtml?: string;
  tables?: unknown[];
}

export function stripDuplicateHeadingFromPages<T extends ProcessedPageLike>(
  pages: T[],
  fileName: string
): T[] {
  if (pages.length === 0) return pages;
  
  const firstPage = pages[0];
  const lines = firstPage.text.split('\n');
  const firstNonEmpty = lines.find(l => l.trim().length > 0);
  
  if (!firstNonEmpty) return pages;
  
  const normalizedFirst = normalizeForComparison(firstNonEmpty);
  const normalizedName = normalizeForComparison(fileName);
  
  const shouldStripText = normalizedFirst === normalizedName;
  
  if (shouldStripText) {
    const firstLineIndex = lines.findIndex(l => l.trim().length > 0);
    const newText = lines.slice(firstLineIndex + 1).join('\n');
    
    let newStyledHtml = firstPage.styledHtml;
    if (newStyledHtml) {
      newStyledHtml = stripDuplicateFirstHtmlElement(newStyledHtml, fileName);
    }
    
    return [{ ...firstPage, text: newText, styledHtml: newStyledHtml }, ...pages.slice(1)];
  }
  
  if (firstPage.styledHtml) {
    const newStyledHtml = stripDuplicateFirstHtmlElement(firstPage.styledHtml, fileName);
    if (newStyledHtml !== firstPage.styledHtml) {
      return [{ ...firstPage, styledHtml: newStyledHtml }, ...pages.slice(1)];
    }
  }
  
  return pages;
}
