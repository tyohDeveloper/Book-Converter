import type { VisualStyles } from "./types";

export function visualStylesToDeclarations(styles: VisualStyles): Record<string, string> {
  const decls: Record<string, string> = {};
  
  if (styles.typography.fontFamily) decls['font-family'] = styles.typography.fontFamily;
  if (styles.typography.fontSize) decls['font-size'] = styles.typography.fontSize;
  if (styles.typography.fontWeight && styles.typography.fontWeight !== 'normal') decls['font-weight'] = styles.typography.fontWeight;
  if (styles.typography.fontStyle && styles.typography.fontStyle !== 'normal') decls['font-style'] = styles.typography.fontStyle;
  if (styles.typography.lineHeight) decls['line-height'] = styles.typography.lineHeight;
  if (styles.typography.letterSpacing && styles.typography.letterSpacing !== 'normal') decls['letter-spacing'] = styles.typography.letterSpacing;
  
  if (styles.colors.color) decls['color'] = styles.colors.color;
  if (styles.colors.backgroundColor) decls['background-color'] = styles.colors.backgroundColor;
  
  const paddings = [styles.spacing.paddingTop, styles.spacing.paddingBottom, styles.spacing.paddingLeft, styles.spacing.paddingRight];
  const allPaddingSame = paddings.every(p => p === paddings[0]) && paddings[0];
  if (allPaddingSame) {
    decls['padding'] = paddings[0];
  } else {
    if (styles.spacing.paddingTop) decls['padding-top'] = styles.spacing.paddingTop;
    if (styles.spacing.paddingBottom) decls['padding-bottom'] = styles.spacing.paddingBottom;
    if (styles.spacing.paddingLeft) decls['padding-left'] = styles.spacing.paddingLeft;
    if (styles.spacing.paddingRight) decls['padding-right'] = styles.spacing.paddingRight;
  }
  
  const margins = [styles.spacing.marginTop, styles.spacing.marginBottom, styles.spacing.marginLeft, styles.spacing.marginRight];
  const allMarginSame = margins.every(m => m === margins[0]) && margins[0];
  if (allMarginSame) {
    decls['margin'] = margins[0];
  } else {
    if (styles.spacing.marginTop) decls['margin-top'] = styles.spacing.marginTop;
    if (styles.spacing.marginBottom) decls['margin-bottom'] = styles.spacing.marginBottom;
    if (styles.spacing.marginLeft) decls['margin-left'] = styles.spacing.marginLeft;
    if (styles.spacing.marginRight) decls['margin-right'] = styles.spacing.marginRight;
  }
  
  if (styles.spacing.maxWidth) decls['max-width'] = styles.spacing.maxWidth;
  
  if (styles.text.textAlign && styles.text.textAlign !== 'left') decls['text-align'] = styles.text.textAlign;
  if (styles.text.textIndent && styles.text.textIndent !== '0') decls['text-indent'] = styles.text.textIndent;
  
  return decls;
}
