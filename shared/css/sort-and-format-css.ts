import { naturalCompare } from "../utils/natural-sort";

interface CssBlock {
  selector: string;
  declarations: Record<string, string>;
  raw?: string;
  level: number;
}

function parseDeclarations(style: string): Record<string, string> {
  const decls: Record<string, string> = {};
  for (const part of style.split(';')) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const prop = part.slice(0, colonIdx).trim().toLowerCase();
      const val = part.slice(colonIdx + 1).trim();
      if (prop && val) decls[prop] = val;
    }
  }
  return decls;
}

function getCascadeLevel(selector: string): number {
  if (selector.startsWith('@import')) return 0;
  if (selector.startsWith('@')) return 1;
  if (/^[a-z]/i.test(selector) && !selector.startsWith('.')) return 2;
  if (selector.startsWith('.')) return 3;
  return 2;
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

function extractAtRules(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  const regex = /@([a-z-]+)\s*\{([^}]*)\}/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const atRule = '@' + match[1];
    blocks.push({
      selector: atRule,
      declarations: parseDeclarations(match[2]),
      raw: match[0].trim(),
      level: 1,
    });
  }
  return blocks;
}


function extractRules(css: string): CssBlock[] {
  const cleanCss = css
    .replace(/@import\s+(?:url\s*\([^)]+\)|'[^']+'|"[^"]+")\s*;/gi, '')
    .replace(/@[a-z-]+\s*\{[^}]*\}/gi, '');
  
  const blocks: CssBlock[] = [];
  const selectorMap = new Map<string, CssBlock>();
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
      const block: CssBlock = { selector, declarations, level: getCascadeLevel(selector) };
      selectorMap.set(selector, block);
      blocks.push(block);
    }
  }
  return blocks;
}

function formatDeclarations(declarations: Record<string, string>): string {
  return Object.entries(declarations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');
}

function formatBlock(block: CssBlock): string {
  const decls = formatDeclarations(block.declarations);
  return `${block.selector} {\n${decls}\n}`;
}

function sortBlocks(blocks: CssBlock[]): CssBlock[] {
  return [...blocks].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return naturalCompare(a.selector, b.selector);
  });
}

function extractInstructionComments(css: string): string[] {
  const comments: string[] = [];
  const regex = /\/\*\s*db-instruction:[^*]*\*\//g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    comments.push(match[0].trim());
  }
  return comments;
}

export function sortAndFormatCss(css: string): string {
  const instructions = extractInstructionComments(css);
  const imports = extractImports(css);
  const atRules = extractAtRules(css);
  const rules = extractRules(css);
  
  const allBlocks = [...atRules, ...rules];
  const sorted = sortBlocks(allBlocks);
  
  const parts: string[] = [];
  
  for (const inst of instructions) {
    parts.push(inst);
  }
  if (instructions.length > 0) parts.push('');
  
  for (const imp of imports) {
    parts.push(imp);
  }
  if (imports.length > 0) parts.push('');
  
  for (const block of sorted) {
    parts.push(formatBlock(block));
    parts.push('');
  }
  
  return parts.join('\n').trim();
}
