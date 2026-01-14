function normalizeDeclarations(decl: string): string {
  return decl
    .split(';')
    .map(d => d.trim())
    .filter(Boolean)
    .sort()
    .join('; ');
}

function sanitizeForClassName(fileName: string): string {
  return fileName
    .replace(/\.(html|xhtml|htm)$/i, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function applyVariantToSelector(selector: string, variantClass: string): string {
  if (selector.includes(',')) {
    return selector
      .split(',')
      .map(s => applyVariantToSingleSelector(s.trim(), variantClass))
      .join(', ');
  }
  return applyVariantToSingleSelector(selector, variantClass);
}

function applyVariantToSingleSelector(selector: string, variantClass: string): string {
  const parts = selector.split(/\s+/);
  const lastPart = parts[parts.length - 1];
  
  const pseudoMatch = lastPart.match(/(::?[a-z-]+(?:\([^)]*\))?)$/i);
  if (pseudoMatch) {
    const basePart = lastPart.slice(0, -pseudoMatch[0].length);
    const pseudoPart = pseudoMatch[0];
    parts[parts.length - 1] = `${basePart}${variantClass}${pseudoPart}`;
  } else {
    parts[parts.length - 1] = `${lastPart}${variantClass}`;
  }
  
  return parts.join(' ');
}

export interface OutputRule {
  selector: string;
  declarations: string;
}

export function buildVariantRules(
  selectorGroups: Map<string, { declarations: string; fileName: string }[]>
): OutputRule[] {
  const outputRules: OutputRule[] = [];
  
  for (const [selector, occurrences] of Array.from(selectorGroups.entries())) {
    const normalizedGroups = new Map<string, string[]>();
    
    for (const occ of occurrences) {
      const normalized = normalizeDeclarations(occ.declarations);
      const files = normalizedGroups.get(normalized) || [];
      files.push(occ.fileName);
      normalizedGroups.set(normalized, files);
    }
    
    const variants = Array.from(normalizedGroups.entries())
      .map(([decl, files]) => ({ declarations: decl, files, count: files.length }))
      .sort((a, b) => b.count - a.count);
    
    if (variants.length === 1) {
      outputRules.push({ selector, declarations: variants[0].declarations });
    } else {
      outputRules.push({ selector, declarations: variants[0].declarations });
      
      let variantNum = 1;
      for (let i = 1; i < variants.length; i++) {
        const variant = variants[i];
        let variantClass: string;
        
        if (variant.files.length === 1) {
          const suffix = sanitizeForClassName(variant.files[0]);
          variantClass = `.from-${suffix}`;
        } else {
          variantClass = `.variant-${String(variantNum).padStart(3, '0')}`;
          variantNum++;
        }
        
        const variantSelector = applyVariantToSelector(selector, variantClass);
        outputRules.push({ selector: variantSelector, declarations: variant.declarations });
      }
    }
  }
  
  return outputRules;
}
