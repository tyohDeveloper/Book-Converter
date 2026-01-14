import type { OutputRule } from "./build-variant-rules";

export function formatCssOutput(
  allImports: Set<string>,
  allAtRules: Set<string>,
  outputRules: OutputRule[]
): string {
  const outputParts: string[] = [];
  
  for (const imp of Array.from(allImports)) {
    outputParts.push(imp);
  }
  
  if (allImports.size > 0) {
    outputParts.push('');
  }
  
  for (const atRule of Array.from(allAtRules)) {
    outputParts.push(atRule);
  }
  
  if (allAtRules.size > 0) {
    outputParts.push('');
  }
  
  for (const rule of outputRules) {
    const formattedDecl = rule.declarations
      .split(';')
      .map(d => d.trim())
      .filter(Boolean)
      .map(d => `  ${d};`)
      .join('\n');
    outputParts.push(`${rule.selector} {\n${formattedDecl}\n}`);
  }
  
  return outputParts.join('\n');
}
