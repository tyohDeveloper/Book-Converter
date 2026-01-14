const WHITESPACE_PROPERTIES = [
  "white-space",
  "line-height",
  "letter-spacing",
  "word-spacing",
];

export function stripWhitespaceStyles(body: HTMLElement): number {
  let count = 0;
  const elementsWithStyle = Array.from(body.querySelectorAll("[style]")) as HTMLElement[];
  
  for (const el of elementsWithStyle) {
    const style = el.getAttribute("style");
    if (!style) continue;
    
    const declarations = style.split(";").map(d => d.trim()).filter(Boolean);
    const filtered: string[] = [];
    let modified = false;
    
    for (const decl of declarations) {
      const [prop] = decl.split(":").map(p => p.trim().toLowerCase());
      if (WHITESPACE_PROPERTIES.includes(prop)) {
        modified = true;
        count++;
      } else {
        filtered.push(decl);
      }
    }
    
    if (modified) {
      if (filtered.length === 0) {
        el.removeAttribute("style");
      } else {
        el.setAttribute("style", filtered.join("; "));
      }
    }
  }
  
  return count;
}
