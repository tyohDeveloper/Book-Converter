import type { ParsedStylesheet } from '../contracts/css-editor';

export function stylesheetToCss(parsed: ParsedStylesheet): string {
  const lines: string[] = [];
  
  if (parsed.imports.length > 0) {
    lines.push(...parsed.imports, '');
  }
  
  for (const rule of parsed.rules) {
    if (rule.raw) {
      lines.push(rule.raw, '');
    } else {
      const entries = Object.entries(rule.declarations);
      if (entries.length > 0) {
        lines.push(`${rule.selector} {`);
        lines.push(...entries.map(([prop, value]) => `  ${prop}: ${value};`));
        lines.push('}', '');
      }
    }
  }
  
  return lines.join('\n').trim();
}
