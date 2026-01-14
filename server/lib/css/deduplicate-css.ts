import { parseDeclarations } from "./parse-declarations";

interface CssRule {
  selector: string;
  declarations: Record<string, string>;
  order: number;
  isClass: boolean;
}

function normalizeSelector(selector: string): string {
  return selector
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(',')
    .map(s => s.trim())
    .sort()
    .join(', ');
}

function extractImports(css: string): string[] {
  const imports: string[] = [];
  const importRegex = /@import\s+(?:url\s*\([^)]+\)|'[^']+'|"[^"]+")[^;]*;/gi;
  let match;
  while ((match = importRegex.exec(css)) !== null) {
    imports.push(match[0].trim());
  }
  return imports;
}

function extractFontFaces(css: string): string[] {
  const fontFaces: string[] = [];
  const fontFaceRegex = /@font-face\s*\{[^}]*\}/gi;
  let match;
  while ((match = fontFaceRegex.exec(css)) !== null) {
    fontFaces.push(match[0].trim());
  }
  return fontFaces;
}

export function deduplicateCss(css: string): string {
  const imports = extractImports(css);
  const fontFaces = extractFontFaces(css);
  
  const rules: CssRule[] = [];
  const selectorMap = new Map<string, CssRule>();
  let order = 0;
  
  const allRulesRegex = /([^{@]+)\{([^}]*)\}/g;
  let match;
  while ((match = allRulesRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const declBlock = match[2];
    
    if (!selector || selector.startsWith('@')) continue;
    
    const decls = parseDeclarations(declBlock);
    if (Object.keys(decls).length === 0) continue;
    
    const normalizedSelector = normalizeSelector(selector);
    
    const existing = selectorMap.get(normalizedSelector);
    if (existing) {
      Object.assign(existing.declarations, decls);
      existing.order = order++;
    } else {
      const rule: CssRule = { 
        selector: normalizedSelector, 
        declarations: decls, 
        order: order++, 
        isClass: normalizedSelector.startsWith('.') 
      };
      selectorMap.set(normalizedSelector, rule);
      rules.push(rule);
    }
  }
  
  rules.sort((a, b) => a.order - b.order);
  
  const lines: string[] = [];
  
  for (const imp of imports) {
    lines.push(imp);
  }
  if (imports.length > 0) {
    lines.push('');
  }
  
  for (const fontFace of fontFaces) {
    lines.push(fontFace);
  }
  if (fontFaces.length > 0) {
    lines.push('');
  }
  
  for (const rule of rules) {
    const declStr = Object.entries(rule.declarations)
      .map(([prop, val]) => `${prop}: ${val}`)
      .join('; ');
    lines.push(`${rule.selector} { ${declStr} }`);
  }
  
  return lines.join('\n');
}
