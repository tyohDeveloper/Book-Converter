import JSZip from "jszip";
import { parseXML, getElementsByTagNameNS, getTextContent } from "../xml-helpers";
import { logger } from "../../../common/logger";
import type { TocItem } from "../parser-types";

const log = logger.child({ service: "toc-parser" });

export async function parseTocNcx(zip: JSZip, tocPath: string, rootDir: string): Promise<TocItem[]> {
  const fullPath = rootDir ? `${rootDir}/${tocPath}` : tocPath;
  const tocContent = await zip.file(fullPath)?.async("string");
  
  if (!tocContent) {
    log.warn("TOC file not found", { path: fullPath });
    return [];
  }
  
  const doc = parseXML(tocContent);
  const navPoints = getElementsByTagNameNS(doc, null, "navPoint");
  const items: TocItem[] = [];
  
  for (const navPoint of navPoints) {
    const id = navPoint.getAttribute("id") || `nav-${items.length}`;
    const playOrder = parseInt(navPoint.getAttribute("playOrder") || "0", 10);
    
    const navLabels = getElementsByTagNameNS(navPoint as any, null, "navLabel");
    const textEl = navLabels.length > 0 ? 
                   getElementsByTagNameNS(navLabels[0] as any, null, "text")[0] : null;
    const title = getTextContent(textEl);
    
    const contents = getElementsByTagNameNS(navPoint as any, null, "content");
    const src = contents.length > 0 ? contents[0].getAttribute("src") || "" : "";
    
    if (title && src) {
      items.push({ id, playOrder, title, src });
    }
  }
  
  return items.sort((a, b) => a.playOrder - b.playOrder);
}

export function extractTitleFromXhtml(content: string): string | null {
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    if (title && title !== "Content") return title;
  }
  
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, "").trim();
  }
  
  const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) {
    return h2Match[1].replace(/<[^>]+>/g, "").trim();
  }
  
  return null;
}
