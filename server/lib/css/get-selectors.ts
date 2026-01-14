import type { ParsedStylesheet } from "@shared/contracts/css-editor";

export function getSelectors(parsed: ParsedStylesheet): string[] {
  return parsed.rules
    .filter(r => !r.selector.startsWith('@') && !r.selector.startsWith(':root'))
    .map(r => r.selector);
}
