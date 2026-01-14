import { toCanonicalStyle, declarationsToString } from "../../lib/css/parse-declarations";
import { generateClassName, generateUniquePrefix } from "../../lib/css/class-name-generator";
import type { ClassInfo } from "../../lib/css/parse-class-rules";

export interface ExtractResult {
  elementsUpdated: number;
  newRules: string[];
}

export function extractInlineStylesToClasses(
  doc: Document,
  existingCss: string,
  existingStyleToClass: Map<string, string>
): ExtractResult {
  const newRules: string[] = [];
  let elementsUpdated = 0;

  const inlinePrefix = generateUniquePrefix(existingCss, "is");
  const inlineStyleMap = new Map<string, { className: string; style: string; isNew: boolean }>();
  let inlineIndex = 1;

  const elementsWithStyle = doc.querySelectorAll("[style]");
  for (const el of Array.from(elementsWithStyle)) {
    const style = el.getAttribute("style");
    if (!style) continue;

    const canonical = toCanonicalStyle(style);
    if (!canonical) {
      el.removeAttribute("style");
      elementsUpdated++;
      continue;
    }

    let entry = inlineStyleMap.get(canonical);
    if (!entry) {
      const existingClassName = existingStyleToClass.get(canonical);
      if (existingClassName) {
        entry = { className: existingClassName, style: canonical, isNew: false };
      } else {
        entry = { className: generateClassName(inlineIndex++, inlinePrefix), style: canonical, isNew: true };
      }
      inlineStyleMap.set(canonical, entry);
    }

    const existingClass = el.getAttribute("class") || "";
    const classes = existingClass.split(/\s+/).filter(Boolean);
    if (!classes.includes(entry.className)) {
      classes.push(entry.className);
      el.setAttribute("class", classes.join(" "));
    }
    el.removeAttribute("style");
    elementsUpdated++;
  }

  for (const [, { className, style, isNew }] of Array.from(inlineStyleMap.entries())) {
    if (isNew) {
      newRules.push(`.${className} { ${style}; }`);
    }
  }

  return { elementsUpdated, newRules };
}

export function buildStyleToClassMap(
  classMap: Map<string, ClassInfo>
): Map<string, string> {
  const styleToClass = new Map<string, string>();
  for (const [className, info] of Array.from(classMap.entries())) {
    const styleStr = declarationsToString(info.declarations);
    if (styleStr && !styleToClass.has(styleStr)) {
      styleToClass.set(styleStr, className);
    }
  }
  return styleToClass;
}
