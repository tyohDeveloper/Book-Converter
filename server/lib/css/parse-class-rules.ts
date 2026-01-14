import { parseDeclarations } from "./parse-declarations";

export interface ClassInfo {
  declarations: Record<string, string>;
  lastOrder: number;
}

export function parseClassDeclarations(css: string): Map<string, ClassInfo> {
  const classMap = new Map<string, ClassInfo>();
  const ruleRegex = /\.(-?[a-zA-Z_][\w-]*)\s*\{([^}]*)\}/g;
  let match;
  let order = 0;
  while ((match = ruleRegex.exec(css)) !== null) {
    const className = match[1];
    const decls = parseDeclarations(match[2]);
    if (Object.keys(decls).length > 0) {
      const existing = classMap.get(className);
      if (existing) {
        Object.assign(existing.declarations, decls);
        existing.lastOrder = order++;
      } else {
        classMap.set(className, { declarations: decls, lastOrder: order++ });
      }
    }
  }
  return classMap;
}

export function mergeDeclarations(classes: string[], classMap: Map<string, ClassInfo>): Record<string, string> {
  const classesWithOrder = classes
    .map(cls => ({ cls, info: classMap.get(cls) }))
    .filter((x): x is { cls: string; info: ClassInfo } => x.info !== undefined)
    .sort((a, b) => a.info.lastOrder - b.info.lastOrder);
  
  const merged: Record<string, string> = {};
  for (const { info } of classesWithOrder) {
    Object.assign(merged, info.declarations);
  }
  return merged;
}
