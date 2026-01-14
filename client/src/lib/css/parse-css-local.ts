import type { ParsedStylesheet, CssRule } from '@shared/contracts/css-editor';

export function parseCssRules(css: string): ParsedStylesheet {
  const imports: string[] = [];
  const rules: CssRule[] = [];
  
  const importRegex = /@import\s+(?:url\s*\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])\s*;/g;
  let match;
  while ((match = importRegex.exec(css)) !== null) {
    const url = match[1] || match[2];
    if (url) imports.push(`@import url('${url}');`);
  }
  
  const cssWithoutImports = css.replace(importRegex, '');
  
  const ruleRegex = /([^{]+)\{([^}]*)\}/g;
  while ((match = ruleRegex.exec(cssWithoutImports)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();
    
    if (!selector || selector.startsWith('@font-face')) continue;
    
    const declarations: Record<string, string> = {};
    const parts = body.split(';').filter(p => p.trim());
    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx > 0) {
        const prop = part.slice(0, colonIdx).trim();
        const value = part.slice(colonIdx + 1).trim();
        if (prop && value) declarations[prop] = value;
      }
    }
    
    rules.push({ selector, declarations, editable: true });
  }
  
  return { imports, rules };
}
