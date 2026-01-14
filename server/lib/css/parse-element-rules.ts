import { parseDeclarations } from "./parse-declarations";

export interface ElementSelectorInfo {
  declarations: Record<string, string>;
  order: number;
}

export function parseElementSelectors(css: string): Map<string, ElementSelectorInfo> {
  const elementMap = new Map<string, ElementSelectorInfo>();
  const ruleRegex = /(?:^|[}\s])([a-z][a-z0-9]*)\s*\{([^}]*)\}/gi;
  let match;
  let order = 0;
  while ((match = ruleRegex.exec(css)) !== null) {
    const tagName = match[1].toLowerCase();
    const decls = parseDeclarations(match[2]);
    if (Object.keys(decls).length > 0) {
      const existing = elementMap.get(tagName);
      if (existing) {
        Object.assign(existing.declarations, decls);
        existing.order = order++;
      } else {
        elementMap.set(tagName, { declarations: decls, order: order++ });
      }
    }
  }
  return elementMap;
}
