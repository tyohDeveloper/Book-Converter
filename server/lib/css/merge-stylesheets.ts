import { parseDeclarations } from "./parse-declarations";

interface MergeRule {
  selector: string;
  declarations: Record<string, string>;
  order: number;
}

function extractImports(css: string): string[] {
  const imports: string[] = [];
  const regex = /@import\s+(?:url\s*\([^)]+\)|'[^']+'|"[^"]+")\s*;/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    imports.push(match[0].trim());
  }
  return imports;
}

function extractFontFaces(css: string): string[] {
  const fontFaces: string[] = [];
  const regex = /@font-face\s*\{[^}]*\}/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    fontFaces.push(match[0].trim());
  }
  return fontFaces;
}

function extractRootVars(css: string): string[] {
  const rootVars: string[] = [];
  const regex = /:root\s*\{[^}]*\}/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    rootVars.push(match[0].trim());
  }
  return rootVars;
}

function normalizeSelector(selector: string): string {
  return selector.trim().toLowerCase().replace(/\s+/g, ' ');
}

function extractRules(css: string): MergeRule[] {
  const cleanCss = css
    .replace(/@import\s+(?:url\s*\([^)]+\)|'[^']+'|"[^"]+")\s*;/gi, '')
    .replace(/@font-face\s*\{[^}]*\}/gi, '')
    .replace(/:root\s*\{[^}]*\}/gi, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const rules: MergeRule[] = [];
  const regex = /([^{@]+)\{([^}]*)\}/g;
  let match;
  let order = 0;

  while ((match = regex.exec(cleanCss)) !== null) {
    const selector = match[1].trim();
    const declBlock = match[2].trim();
    if (!selector || selector.startsWith('@')) continue;

    const declarations = parseDeclarations(declBlock);
    if (Object.keys(declarations).length === 0) continue;

    rules.push({ selector: normalizeSelector(selector), declarations, order: order++ });
  }

  return rules;
}

export interface MergeOptions {
  priority?: 'first' | 'last';
}

export function mergeStylesheets(baseCss: string, newCss: string, options: MergeOptions = {}): string {
  const { priority = 'first' } = options;
  
  const baseImports = extractImports(baseCss);
  const newImports = extractImports(newCss);
  const allImports = Array.from(new Set([...baseImports, ...newImports]));

  const baseFontFaces = extractFontFaces(baseCss);
  const newFontFaces = extractFontFaces(newCss);
  const allFontFaces = Array.from(new Set([...baseFontFaces, ...newFontFaces]));

  const baseRootVars = extractRootVars(baseCss);
  const newRootVars = extractRootVars(newCss);
  const allRootVars = Array.from(new Set([...baseRootVars, ...newRootVars]));

  const baseRules = extractRules(baseCss);
  const newRules = extractRules(newCss);

  const selectorMap = new Map<string, MergeRule>();
  let globalOrder = 0;

  for (const rule of baseRules) {
    selectorMap.set(rule.selector, { ...rule, order: globalOrder++ });
  }

  for (const rule of newRules) {
    const existing = selectorMap.get(rule.selector);
    if (existing) {
      if (priority === 'first') {
        for (const [prop, val] of Object.entries(rule.declarations)) {
          if (!(prop in existing.declarations)) {
            existing.declarations[prop] = val;
          }
        }
      } else {
        Object.assign(existing.declarations, rule.declarations);
        existing.order = globalOrder++;
      }
    } else {
      selectorMap.set(rule.selector, { ...rule, order: globalOrder++ });
    }
  }

  const mergedRules = Array.from(selectorMap.values()).sort((a, b) => a.order - b.order);

  const lines: string[] = [];

  for (const imp of allImports) {
    lines.push(imp);
  }
  if (allImports.length > 0) lines.push('');

  for (const fontFace of allFontFaces) {
    lines.push(fontFace);
  }
  if (allFontFaces.length > 0) lines.push('');

  for (const rootVar of allRootVars) {
    lines.push(rootVar);
  }
  if (allRootVars.length > 0) lines.push('');

  for (const rule of mergedRules) {
    const declStr = Object.entries(rule.declarations)
      .map(([prop, val]) => `${prop}: ${val}`)
      .join('; ');
    lines.push(`${rule.selector} { ${declStr} }`);
  }

  return lines.join('\n');
}
