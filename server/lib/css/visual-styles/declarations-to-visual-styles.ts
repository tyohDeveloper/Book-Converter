import type { VisualStyles } from "./types";

export function declarationsToVisualStyles(decls: Record<string, string>): VisualStyles {
  return {
    typography: {
      fontFamily: decls['font-family'] || '',
      fontSize: decls['font-size'] || '',
      fontWeight: decls['font-weight'] || '',
      fontStyle: decls['font-style'] || '',
      lineHeight: decls['line-height'] || '',
      letterSpacing: decls['letter-spacing'] || '',
    },
    colors: {
      color: decls['color'] || '',
      backgroundColor: decls['background-color'] || decls['background'] || '',
    },
    spacing: {
      marginTop: decls['margin-top'] || decls['margin'] || '',
      marginBottom: decls['margin-bottom'] || decls['margin'] || '',
      marginLeft: decls['margin-left'] || decls['margin'] || '',
      marginRight: decls['margin-right'] || decls['margin'] || '',
      paddingTop: decls['padding-top'] || decls['padding'] || '',
      paddingBottom: decls['padding-bottom'] || decls['padding'] || '',
      paddingLeft: decls['padding-left'] || decls['padding'] || '',
      paddingRight: decls['padding-right'] || decls['padding'] || '',
      maxWidth: decls['max-width'] || '',
    },
    text: {
      textAlign: decls['text-align'] || '',
      textIndent: decls['text-indent'] || '',
    },
  };
}
