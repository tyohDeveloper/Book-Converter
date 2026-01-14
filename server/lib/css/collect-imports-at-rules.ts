export function collectAllImportsAndAtRules(
  fileStyles: { imports: string[]; atRules: string[] }[]
): { allImports: Set<string>; allAtRules: Set<string> } {
  const allImports = new Set<string>();
  const allAtRules = new Set<string>();
  
  for (const fs of fileStyles) {
    for (const imp of fs.imports) {
      allImports.add(imp);
    }
    for (const atRule of fs.atRules) {
      allAtRules.add(atRule);
    }
  }
  
  return { allImports, allAtRules };
}
