import { DOMParser } from "@xmldom/xmldom";

export function parseXML(content: string): Document {
  return new DOMParser().parseFromString(content, "text/xml");
}

export function getTextContent(element: Element | null): string {
  if (!element) return "";
  return element.textContent?.trim() || "";
}

export function getElementsByTagNameNS(doc: Document | Element, ns: string | null, localName: string): Element[] {
  const elements: Element[] = [];
  
  if (ns) {
    const nodeList = (doc as any).getElementsByTagNameNS?.(ns, localName);
    if (nodeList && nodeList.length > 0) {
      for (let i = 0; i < nodeList.length; i++) {
        elements.push(nodeList[i] as Element);
      }
      return elements;
    }
  }
  
  const nodeList = (doc as any).getElementsByTagName?.(localName);
  if (nodeList) {
    for (let i = 0; i < nodeList.length; i++) {
      elements.push(nodeList[i] as Element);
    }
  }
  
  if (elements.length === 0) {
    const wildcardList = (doc as any).getElementsByTagNameNS?.("*", localName);
    if (wildcardList) {
      for (let i = 0; i < wildcardList.length; i++) {
        elements.push(wildcardList[i] as Element);
      }
    }
  }
  
  return elements;
}
