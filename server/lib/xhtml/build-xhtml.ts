import { escapeXML } from "../../domain/xml";
import { normalizeToXhtml } from "./normalize-to-xhtml";

const DEFAULT_STYLESHEET = `body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
nav.toc { margin-bottom: 2em; padding: 1em; background: #f5f5f5; border-radius: 4px; }
nav.toc h2 { margin-top: 0; }
nav.toc ol { padding-left: 1.5em; }
section { margin-bottom: 2em; }
h1, h2 { color: #333; }
img { max-width: 100%; height: auto; }`;

export interface XhtmlBuildOptions {
  title: string;
  content: string;
  lang?: string;
  styles?: {
    inline?: string[];
    externalStylesheet?: string;
  };
  skipCss?: boolean;
  includeH1?: boolean;
  normalizeContent?: boolean;
  includeDefaultStyles?: boolean;
}

export function buildXhtml(options: XhtmlBuildOptions): string {
  const {
    title,
    content,
    lang = "en",
    styles = {},
    skipCss = false,
    includeH1 = false,
    normalizeContent = false,
    includeDefaultStyles = true,
  } = options;

  const escapedTitle = escapeXML(title);
  
  let styleSection = "";
  if (!skipCss) {
    const parts: string[] = [];
    
    if (styles.externalStylesheet) {
      parts.push(`<link rel="stylesheet" type="text/css" href="${styles.externalStylesheet}" />`);
    }
    
    const allInlineStyles: string[] = [];
    if (includeDefaultStyles) {
      allInlineStyles.push(DEFAULT_STYLESHEET);
    }
    if (styles.inline && styles.inline.length > 0) {
      allInlineStyles.push(...styles.inline);
    }
    
    if (allInlineStyles.length > 0) {
      parts.push(`<style type="text/css">\n${allInlineStyles.join("\n\n")}\n</style>`);
    }
    
    styleSection = parts.join("\n  ");
  }

  const h1Element = includeH1 ? `  <h1>${escapedTitle}</h1>\n` : "";
  const bodyContent = normalizeContent ? normalizeToXhtml(content) : content;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">
<head>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8" />
  <title>${escapedTitle}</title>
  ${styleSection}
</head>
<body>
${h1Element}${bodyContent}
</body>
</html>`;
}
