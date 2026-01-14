interface CssRule {
  selector: string;
  declarations: string;
}

interface FileStyles {
  fileName: string;
  rules: CssRule[];
}

export function groupRulesBySelector(
  fileStyles: FileStyles[]
): Map<string, { declarations: string; fileName: string }[]> {
  const selectorGroups = new Map<string, { declarations: string; fileName: string }[]>();
  
  for (const fs of fileStyles) {
    for (const rule of fs.rules) {
      const group = selectorGroups.get(rule.selector) || [];
      group.push({ declarations: rule.declarations, fileName: fs.fileName });
      selectorGroups.set(rule.selector, group);
    }
  }
  
  return selectorGroups;
}
