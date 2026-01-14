import { STYLE_MAPPINGS, isNoiseStyle } from "./style-mappings";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function encodeStyleForXhtml(style: string): string {
  return style.replace(/"/g, '&quot;');
}

function extractStyleComponents(style: string): { commonStyles: string[]; uniqueStyles: string[] } {
  const decodedStyle = decodeHtmlEntities(style);
  const parts = decodedStyle.split(";").map(s => s.trim()).filter(Boolean);
  const common: string[] = [];
  const unique: string[] = [];
  
  for (const part of parts) {
    if (isNoiseStyle(part)) {
      continue;
    }
    
    let isCommon = false;
    for (const mapping of STYLE_MAPPINGS) {
      if (mapping.pattern.test(part)) {
        isCommon = true;
        break;
      }
    }
    if (isCommon) {
      common.push(part);
    } else {
      unique.push(part);
    }
  }
  
  return { commonStyles: common, uniqueStyles: unique };
}

export function extractInlineStylesToClasses(html: string): { html: string; cssClasses: Set<string> } {
  const usedClasses = new Set<string>();
  
  const result = html.replace(/<(\w+)([^>]*)style="([^"]*)"([^>]*)>/gi, (match, tagName, before, style, after) => {
    const { commonStyles, uniqueStyles } = extractStyleComponents(style);
    const classes: string[] = [];
    
    for (const mapping of STYLE_MAPPINGS) {
      if (commonStyles.some(s => mapping.pattern.test(s))) {
        classes.push(mapping.className);
        usedClasses.add(mapping.className);
      }
    }
    
    const existingClass = before.match(/class="([^"]*)"/i) || after.match(/class="([^"]*)"/i);
    const existingClasses = existingClass ? existingClass[1].split(/\s+/).filter(Boolean) : [];
    const allClasses = [...existingClasses, ...classes];
    const cleanBefore = before.replace(/class="[^"]*"/gi, "");
    const cleanAfter = after.replace(/class="[^"]*"/gi, "");
    
    const encodedUniqueStyles = uniqueStyles.map(encodeStyleForXhtml);
    
    if (allClasses.length > 0 && encodedUniqueStyles.length > 0) {
      return `<${tagName}${cleanBefore}class="${allClasses.join(" ")}" style="${encodedUniqueStyles.join("; ")}"${cleanAfter}>`;
    }
    if (allClasses.length > 0) {
      return `<${tagName}${cleanBefore}class="${allClasses.join(" ")}"${cleanAfter}>`;
    }
    if (encodedUniqueStyles.length > 0) {
      return `<${tagName}${cleanBefore}style="${encodedUniqueStyles.join("; ")}"${cleanAfter}>`;
    }
    return `<${tagName}${cleanBefore}${cleanAfter}>`;
  });
  
  return { html: result, cssClasses: usedClasses };
}
