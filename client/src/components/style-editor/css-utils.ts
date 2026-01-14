import { DocumentStyles, DEFAULT_STYLES } from "./style-types";

// Parse CSS string into DocumentStyles object
export function parseCssToStyles(css: string): { styles: DocumentStyles; imports: string[] } {
  const styles: DocumentStyles = JSON.parse(JSON.stringify(DEFAULT_STYLES));
  const imports: string[] = [];
  
  // Extract @import statements (handles both url() and quoted forms)
  const importRegex = /@import\s+(?:url\s*\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"]);?/g;
  let match;
  while ((match = importRegex.exec(css)) !== null) {
    const url = match[1] || match[2];
    if (url) {
      imports.push(`@import url('${url}');`);
    }
  }
  
  // Extract body styles
  const bodyMatch = css.match(/body\s*\{([^}]+)\}/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1];
    
    // Typography
    const fontFamily = extractProperty(bodyContent, "font-family");
    if (fontFamily) styles.typography.fontFamily = fontFamily;
    
    const fontSize = extractProperty(bodyContent, "font-size");
    if (fontSize) styles.typography.fontSize = fontSize;
    
    const fontWeight = extractProperty(bodyContent, "font-weight");
    if (fontWeight) styles.typography.fontWeight = fontWeight;
    
    const fontStyle = extractProperty(bodyContent, "font-style");
    if (fontStyle) styles.typography.fontStyle = fontStyle;
    
    const lineHeight = extractProperty(bodyContent, "line-height");
    if (lineHeight) styles.typography.lineHeight = lineHeight;
    
    const letterSpacing = extractProperty(bodyContent, "letter-spacing");
    if (letterSpacing) styles.typography.letterSpacing = letterSpacing;
    
    // Colors
    const color = extractProperty(bodyContent, "color");
    if (color) styles.colors.color = color;
    
    const backgroundColor = extractProperty(bodyContent, "background-color") || extractProperty(bodyContent, "background");
    if (backgroundColor) styles.colors.backgroundColor = backgroundColor;
    
    // Spacing
    const margin = extractProperty(bodyContent, "margin");
    if (margin) {
      const parts = margin.split(/\s+/);
      if (parts.length === 1) {
        styles.spacing.marginTop = styles.spacing.marginBottom = styles.spacing.marginLeft = styles.spacing.marginRight = parts[0];
      } else if (parts.length === 2) {
        styles.spacing.marginTop = styles.spacing.marginBottom = parts[0];
        styles.spacing.marginLeft = styles.spacing.marginRight = parts[1];
      } else if (parts.length === 4) {
        [styles.spacing.marginTop, styles.spacing.marginRight, styles.spacing.marginBottom, styles.spacing.marginLeft] = parts;
      }
    }
    
    const padding = extractProperty(bodyContent, "padding");
    if (padding) {
      const parts = padding.split(/\s+/);
      if (parts.length === 1) {
        styles.spacing.paddingTop = styles.spacing.paddingBottom = styles.spacing.paddingLeft = styles.spacing.paddingRight = parts[0];
      } else if (parts.length === 2) {
        styles.spacing.paddingTop = styles.spacing.paddingBottom = parts[0];
        styles.spacing.paddingLeft = styles.spacing.paddingRight = parts[1];
      } else if (parts.length === 4) {
        [styles.spacing.paddingTop, styles.spacing.paddingRight, styles.spacing.paddingBottom, styles.spacing.paddingLeft] = parts;
      }
    }
    
    // Max width
    const maxWidth = extractProperty(bodyContent, "max-width");
    if (maxWidth) styles.spacing.maxWidth = maxWidth;
    
    // Text
    const textAlign = extractProperty(bodyContent, "text-align");
    if (textAlign) styles.text.textAlign = textAlign;
    
    const textIndent = extractProperty(bodyContent, "text-indent");
    if (textIndent) styles.text.textIndent = textIndent;
  }
  
  return { styles, imports };
}

function extractProperty(css: string, property: string): string | null {
  const regex = new RegExp(`${property}\\s*:\\s*([^;]+);?`, "i");
  const match = css.match(regex);
  return match ? match[1].trim() : null;
}

// Convert DocumentStyles object back to CSS string
export function stylesToCss(styles: DocumentStyles, imports: string[] = []): string {
  const lines: string[] = [];
  
  // Add imports at top
  if (imports.length > 0) {
    lines.push(...imports);
    lines.push("");
  }
  
  // Build body styles
  const bodyProps: string[] = [];
  
  // Typography
  if (styles.typography.fontFamily) {
    bodyProps.push(`font-family: ${styles.typography.fontFamily}`);
  }
  if (styles.typography.fontSize && styles.typography.fontSize !== "16px") {
    bodyProps.push(`font-size: ${styles.typography.fontSize}`);
  }
  if (styles.typography.fontWeight && styles.typography.fontWeight !== "normal") {
    bodyProps.push(`font-weight: ${styles.typography.fontWeight}`);
  }
  if (styles.typography.fontStyle && styles.typography.fontStyle !== "normal") {
    bodyProps.push(`font-style: ${styles.typography.fontStyle}`);
  }
  if (styles.typography.lineHeight) {
    bodyProps.push(`line-height: ${styles.typography.lineHeight}`);
  }
  if (styles.typography.letterSpacing && styles.typography.letterSpacing !== "normal") {
    bodyProps.push(`letter-spacing: ${styles.typography.letterSpacing}`);
  }
  
  // Colors
  if (styles.colors.color && styles.colors.color !== "#333333") {
    bodyProps.push(`color: ${styles.colors.color}`);
  }
  if (styles.colors.backgroundColor && styles.colors.backgroundColor !== "#ffffff") {
    bodyProps.push(`background-color: ${styles.colors.backgroundColor}`);
  }
  
  // Spacing - use shorthand where possible
  const marginY = styles.spacing.marginTop === styles.spacing.marginBottom ? styles.spacing.marginTop : null;
  const marginX = styles.spacing.marginLeft === styles.spacing.marginRight ? styles.spacing.marginLeft : null;
  
  if (marginY && marginX && marginY === marginX) {
    if (marginY !== "0") bodyProps.push(`margin: ${marginY}`);
  } else if (marginY && marginX) {
    bodyProps.push(`margin: ${marginY} ${marginX}`);
  }
  
  const paddingY = styles.spacing.paddingTop === styles.spacing.paddingBottom ? styles.spacing.paddingTop : null;
  const paddingX = styles.spacing.paddingLeft === styles.spacing.paddingRight ? styles.spacing.paddingLeft : null;
  
  if (paddingY && paddingX && paddingY === paddingX) {
    if (paddingY !== "0") bodyProps.push(`padding: ${paddingY}`);
  } else if (paddingY && paddingX) {
    bodyProps.push(`padding: ${paddingY} ${paddingX}`);
  }
  
  // Max width
  if (styles.spacing.maxWidth) {
    bodyProps.push(`max-width: ${styles.spacing.maxWidth}`);
  }
  
  // Text
  if (styles.text.textAlign && styles.text.textAlign !== "left") {
    bodyProps.push(`text-align: ${styles.text.textAlign}`);
  }
  if (styles.text.textIndent && styles.text.textIndent !== "0") {
    bodyProps.push(`text-indent: ${styles.text.textIndent}`);
  }
  
  lines.push(`body {`);
  for (const prop of bodyProps) {
    lines.push(`  ${prop};`);
  }
  lines.push(`}`);
  
  return lines.join("\n");
}
