import { parseRules } from "./parse-css-rules";
import { collectAllImportsAndAtRules } from "./collect-imports-at-rules";
import { groupRulesBySelector } from "./group-rules-by-selector";
import { buildVariantRules } from "./build-variant-rules";
import { formatCssOutput } from "./format-css-output";

interface FileStyles {
  fileName: string;
  rules: { selector: string; declarations: string }[];
  imports: string[];
  atRules: string[];
}

export function unifyStyles(stylesByFile: { fileName: string; css: string }[]): string {
  const fileStyles: FileStyles[] = stylesByFile.map(({ fileName, css }) => {
    const { rules, imports, atRules } = parseRules(css);
    return { fileName, rules, imports, atRules };
  });
  
  const { allImports, allAtRules } = collectAllImportsAndAtRules(fileStyles);
  const selectorGroups = groupRulesBySelector(fileStyles);
  const outputRules = buildVariantRules(selectorGroups);
  
  return formatCssOutput(allImports, allAtRules, outputRules);
}
