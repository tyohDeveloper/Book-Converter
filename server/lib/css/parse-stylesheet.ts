import { parseDeclarations } from "./parse-declarations";
import type { CssRule, ParsedStylesheet } from "@shared/contracts/css-editor";

function extractImports(css: string): string[] {
  const imports: string[] = [];
  const regex = /@import\s+(?:url\s*\([^)]+\)|'[^']+'|"[^"]+")\s*;/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    imports.push(match[0].trim());
  }
  return imports;
}

function extractFontFaces(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const regex = /@font-face\s*\{[^}]*\}/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    rules.push({
      selector: '@font-face',
      declarations: {},
      raw: match[0].trim(),
      editable: false,
    });
  }
  return rules;
}

function extractRootVars(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const regex = /:root\s*\{([^}]*)\}/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    rules.push({
      selector: ':root',
      declarations: {},
      raw: `:root { ${match[1].trim()} }`,
      editable: false,
    });
  }
  return rules;
}

export function parseStylesheet(css: string): ParsedStylesheet {
  const imports = extractImports(css);
  const fontFaces = extractFontFaces(css);
  const rootVars = extractRootVars(css);
  
  const cleanCss = css
    .replace(/@import\s+(?:url\s*\([^)]+\)|'[^']+'|"[^"]+")\s*;/gi, '')
    .replace(/@font-face\s*\{[^}]*\}/gi, '')
    .replace(/:root\s*\{[^}]*\}/gi, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  
  const editableRules: CssRule[] = [];
  const selectorMap = new Map<string, CssRule>();
  const ruleRegex = /([^{@]+)\{([^}]*)\}/g;
  let match;
  
  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    const selector = match[1].trim();
    const declBlock = match[2].trim();
    
    if (!selector || selector.startsWith('@')) continue;
    
    const declarations = parseDeclarations(declBlock);
    if (Object.keys(declarations).length === 0) continue;
    
    const existing = selectorMap.get(selector);
    if (existing) {
      Object.assign(existing.declarations, declarations);
    } else {
      const rule: CssRule = {
        selector,
        declarations,
        editable: true,
      };
      selectorMap.set(selector, rule);
      editableRules.push(rule);
    }
  }
  
  return {
    imports,
    rules: [...fontFaces, ...rootVars, ...editableRules],
  };
}

