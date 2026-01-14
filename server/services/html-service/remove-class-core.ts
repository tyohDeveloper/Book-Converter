export interface RemoveClassFromStylesheetResult {
  updatedCss: string;
  classesRemoved: number;
}

export function removeClassesFromStylesheet(
  css: string,
  classNames: string[]
): RemoveClassFromStylesheetResult {
  let updatedCss = css;
  let classesRemoved = 0;

  for (const className of classNames) {
    const classRegex = new RegExp(
      `\\.${className.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}\\s*\\{[^}]*\\}\\s*`,
      "g"
    );
    const before = updatedCss;
    updatedCss = updatedCss.replace(classRegex, "");
    if (updatedCss !== before) classesRemoved++;
  }

  return { updatedCss, classesRemoved };
}

export function removeClassesFromElements(
  doc: Document,
  classNames: string[]
): number {
  const classSet = new Set(classNames);
  let elementsUpdated = 0;

  const allElements = doc.querySelectorAll("[class]");
  for (const el of Array.from(allElements)) {
    const classAttr = el.getAttribute("class") || "";
    const classes = classAttr.split(/\s+/).filter((c) => c);
    const filteredClasses = classes.filter((c) => !classSet.has(c));

    if (filteredClasses.length !== classes.length) {
      if (filteredClasses.length > 0) {
        el.setAttribute("class", filteredClasses.join(" "));
      } else {
        el.removeAttribute("class");
      }
      elementsUpdated++;
    }
  }

  return elementsUpdated;
}
