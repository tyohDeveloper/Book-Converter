import type { ParsedStylesheet } from "@shared/contracts/css-editor";

export function updateRuleInStylesheet(
  parsed: ParsedStylesheet,
  selector: string,
  declarations: Record<string, string>
): ParsedStylesheet {
  const ruleIndex = parsed.rules.findIndex(r => r.selector === selector && r.editable);
  
  if (ruleIndex === -1) {
    return {
      ...parsed,
      rules: [...parsed.rules, { selector, declarations, editable: true }],
    };
  }
  
  const newRules = [...parsed.rules];
  newRules[ruleIndex] = { ...newRules[ruleIndex], declarations };
  return { ...parsed, rules: newRules };
}
