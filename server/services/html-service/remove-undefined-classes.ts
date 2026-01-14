/**
 * Removes class attributes from elements if those classes are not defined in any style tag.
 * Returns the count of class attributes modified or removed.
 */
export function removeUndefinedClasses(body: Element): number {
  let count = 0;
  
  // 1. Collect all defined classes from style tags
  const styleTags = Array.from(body.ownerDocument.getElementsByTagName('style'));
  const definedClasses = new Set<string>();
  
  const classRegex = /\.([a-zA-Z0-9_-]+)/g;
  for (const style of styleTags) {
    const css = style.textContent || '';
    let match;
    while ((match = classRegex.exec(css)) !== null) {
      definedClasses.add(match[1]);
    }
  }

  // 2. Scan all elements for class attributes
  const allElements = body.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (el.hasAttribute('class')) {
      const classes = el.getAttribute('class')!.split(/\s+/);
      const filtered = classes.filter(c => c && definedClasses.has(c));
      
      if (filtered.length !== classes.length) {
        if (filtered.length === 0) {
          el.removeAttribute('class');
        } else {
          el.setAttribute('class', filtered.join(' '));
        }
        count++;
      }
    }
  }

  return count;
}
