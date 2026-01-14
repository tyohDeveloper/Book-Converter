import { getElementsByTagNameNS, getTextContent } from "../xml-helpers";
import type { EpubMetadata, ManifestItem, SpineItem } from "../parser-types";

const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/";

export function parseMetadata(doc: Document): EpubMetadata {
  const titleEl = getElementsByTagNameNS(doc, DC_NAMESPACE, "title")[0] || 
                  getElementsByTagNameNS(doc, null, "title")[0];
  const creatorEl = getElementsByTagNameNS(doc, DC_NAMESPACE, "creator")[0] || 
                    getElementsByTagNameNS(doc, null, "creator")[0];
  const languageEl = getElementsByTagNameNS(doc, DC_NAMESPACE, "language")[0] || 
                     getElementsByTagNameNS(doc, null, "language")[0];
  const identifierEl = getElementsByTagNameNS(doc, DC_NAMESPACE, "identifier")[0] || 
                       getElementsByTagNameNS(doc, null, "identifier")[0];
  
  return {
    title: getTextContent(titleEl) || "Untitled",
    creator: getTextContent(creatorEl) || "Unknown",
    language: getTextContent(languageEl) || "en",
    identifier: getTextContent(identifierEl) || "",
  };
}

export function parseManifest(doc: Document): ManifestItem[] {
  const items: ManifestItem[] = [];
  const manifestItems = getElementsByTagNameNS(doc, null, "item");
  
  for (const item of manifestItems) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    const mediaType = item.getAttribute("media-type");
    
    if (id && href && mediaType) {
      items.push({ id, href, mediaType });
    }
  }
  
  return items;
}

export function parseSpine(doc: Document): SpineItem[] {
  const items: SpineItem[] = [];
  const itemrefs = getElementsByTagNameNS(doc, null, "itemref");
  
  for (const itemref of itemrefs) {
    const idref = itemref.getAttribute("idref");
    const linear = itemref.getAttribute("linear");
    
    if (idref) {
      items.push({ 
        idref, 
        linear: linear !== "no" 
      });
    }
  }
  
  return items;
}
