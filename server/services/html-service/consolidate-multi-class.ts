import { parseClassDeclarations, mergeDeclarations, type ClassInfo } from "../../lib/css/parse-class-rules";
import { declarationsToString } from "../../lib/css/parse-declarations";
import { generateUniquePrefix } from "../../lib/css/class-name-generator";

export interface ConsolidateResult {
  elementsUpdated: number;
  newRules: string[];
  classMap: Map<string, ClassInfo>;
}

export function consolidateMultiClassElements(
  doc: Document,
  existingCss: string
): ConsolidateResult {
  const classMap = parseClassDeclarations(existingCss);
  const newRules: string[] = [];
  let elementsUpdated = 0;

  const multiClassPrefix = generateUniquePrefix(existingCss, "mc");
  const multiClassMap = new Map<string, string>();
  let multiClassIndex = 1;

  const allElements = doc.querySelectorAll("[class]");
  for (const el of Array.from(allElements)) {
    const classAttr = el.getAttribute("class") || "";
    const classes = classAttr.split(/\s+/).filter(Boolean);

    if (classes.length < 2) continue;

    const resolvedClasses = classes.filter((c) => classMap.has(c));
    if (resolvedClasses.length < 2) continue;

    const key = resolvedClasses.sort().join(" ");
    let combinedClass = multiClassMap.get(key);

    if (!combinedClass) {
      combinedClass = `${multiClassPrefix}-${multiClassIndex++}`;
      multiClassMap.set(key, combinedClass);

      const merged = mergeDeclarations(resolvedClasses, classMap);
      const styleStr = declarationsToString(merged);
      if (styleStr) {
        newRules.push(`.${combinedClass} { ${styleStr}; }`);
        classMap.set(combinedClass, { declarations: merged, lastOrder: classMap.size });
      }
    }

    // Keep original classes plus add the combined class
    // This preserves semantic class names while adding the merged utility class
    const allClasses = [...classes, combinedClass];
    el.setAttribute("class", allClasses.join(" "));
    elementsUpdated++;
  }

  return { elementsUpdated, newRules, classMap };
}
