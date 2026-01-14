import { JSDOM } from 'jsdom';

export interface OutlineItem {
  id: string | null;
  text: string;
  level: number;
}

export function extractOutline(html: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading) => {
      const text = heading.textContent?.trim();
      if (!text) return;
      
      const level = parseInt(heading.tagName[1], 10);
      
      let id: string | null = heading.id || null;
      if (!id) {
        const parentSection = heading.closest('section[id]');
        if (parentSection) {
          id = parentSection.id;
        }
      }
      
      items.push({ id, text, level });
    });
  } catch {
    return [];
  }
  
  return items;
}
