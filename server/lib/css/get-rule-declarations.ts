import type { ParsedStylesheet } from "@shared/contracts/css-editor";

export function getRuleDeclarations(parsed: ParsedStylesheet, selector: string): Record<string, string> {
  const rule = parsed.rules.find(r => r.selector === selector);
  return rule?.declarations || {};
}
