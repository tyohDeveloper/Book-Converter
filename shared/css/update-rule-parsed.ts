import type { ParsedStylesheet } from '../contracts/css-editor';

export function updateRuleParsed(
  parsed: ParsedStylesheet,
  selector: string,
  declarations: Record<string, string>
): ParsedStylesheet {
  const ruleIndex = parsed.rules.findIndex(r => r.selector === selector);
  
  if (ruleIndex === -1) {
    return {
      ...parsed,
      rules: [...parsed.rules, { selector, declarations, editable: true }],
    };
  }
  
  const rule = parsed.rules[ruleIndex];
  if (!rule.editable) {
    return parsed;
  }
  
  const newRules = [...parsed.rules];
  newRules[ruleIndex] = { ...rule, declarations };
  return { ...parsed, rules: newRules };
}
