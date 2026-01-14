interface CssRule {
  selector: string;
  declarations: string;
}

export interface ParsedCss {
  rules: CssRule[];
  imports: string[];
  atRules: string[];
}

export function parseRules(css: string): ParsedCss {
  const imports: string[] = [];
  const atRules: string[] = [];
  const rules: CssRule[] = [];
  
  const importRegex = /@import\s+[^;]+;/g;
  let match;
  while ((match = importRegex.exec(css)) !== null) {
    imports.push(match[0].trim());
  }
  
  let cssWithoutImports = css.replace(importRegex, '');
  
  const atRuleRegex = /@(font-face|media|keyframes|supports)[^{]*\{[^{}]*(\{[^}]*\}[^{}]*)*\}/gi;
  while ((match = atRuleRegex.exec(cssWithoutImports)) !== null) {
    atRules.push(match[0].trim());
  }
  cssWithoutImports = cssWithoutImports.replace(atRuleRegex, '');
  
  const ruleRegex = /([^{@]+)\{([^}]*)\}/g;
  while ((match = ruleRegex.exec(cssWithoutImports)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();
    if (selector && !selector.startsWith('@') && !selector.startsWith(':root')) {
      rules.push({ selector, declarations });
    } else if (selector === ':root') {
      atRules.push(`${selector} { ${declarations} }`);
    }
  }
  
  return { rules, imports, atRules };
}
