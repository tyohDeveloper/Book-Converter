/**
 * Flattens invalid nested elements by promoting inner content.
 * Promotes <p>, <div>, and headers (h1-h6) out of surrounding <div> or <p> elements.
 * Also removes empty elements (wrapper divs, empty paragraphs, contentless spans).
 * Returns the count of elements flattened or removed.
 */
export function flattenNestedElements(body: Element): number {
  let count = 0;
  let changed = true;

  while (changed) {
    changed = false;

    // 1. Promote content from <div> elements
    const divs = Array.from(body.getElementsByTagName('DIV'));
    for (const div of divs) {
      const parent = div.parentNode;
      if (!parent) continue;
      
      // Elements that should be promoted out of a <div> to become siblings
      const promotableChildren = Array.from(div.children).filter(
        (child): child is Element => 
          child.nodeName === 'P' || 
          child.nodeName === 'DIV' || 
          /^(H[1-6])$/.test(child.nodeName)
      );
      
      if (promotableChildren.length > 0) {
        for (const child of promotableChildren) {
          parent.insertBefore(child, div);
          count++;
          changed = true;
        }
      }
      
      const hasNoContent = !div.hasChildNodes() || (div.textContent?.trim() === '' && div.children.length === 0);
      if (hasNoContent && div.parentNode) {
        div.parentNode.removeChild(div);
        count++;
        changed = true;
      }
    }

    // 2. Promote <p>, <div>, headers out of <p> elements
    const paragraphs = Array.from(body.getElementsByTagName('P'));
    for (const p of paragraphs) {
      const parent = p.parentNode;
      if (!parent) continue;
      
      // Elements that should be promoted out of a <p> to become siblings
      const promotableChildren = Array.from(p.children).filter(
        (child): child is Element => 
          child.nodeName === 'P' || 
          child.nodeName === 'DIV' || 
          /^H[1-6]$/.test(child.nodeName)
      );
      
      for (const child of promotableChildren) {
        parent.insertBefore(child, p);
        count++;
        changed = true;
      }
      
      // Remove empty paragraphs after promotion
      const hasNoContent = !p.hasChildNodes() || (p.textContent?.trim() === '' && p.children.length === 0);
      if (hasNoContent && p.parentNode) {
        p.parentNode.removeChild(p);
        count++;
        changed = true;
      }
    }

    // 3. Remove contentless spans and flatten nested spans
    const spans = Array.from(body.getElementsByTagName('SPAN'));
    for (const span of spans) {
      if (!span.parentNode) continue;
      
      const nestedSpans = Array.from(span.children).filter(
        (child): child is Element => child.nodeName === 'SPAN'
      );
      
      for (const inner of nestedSpans) {
        while (inner.firstChild) {
          span.insertBefore(inner.firstChild, inner);
        }
        span.removeChild(inner);
        count++;
        changed = true;
      }

      const hasNoContent = !span.hasChildNodes() || (span.textContent === '' && span.children.length === 0);
      if (hasNoContent && span.parentNode) {
        span.parentNode.removeChild(span);
        count++;
        changed = true;
      }
    }
  }

  return count;
}
