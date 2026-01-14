import type { PdfFont } from "./extract-pdf-fonts";

const FONT_FALLBACKS: Record<string, string> = {
  "Times": "Times New Roman, Georgia, serif",
  "Times-Roman": "Times New Roman, Georgia, serif",
  "TimesNewRoman": "Times New Roman, Georgia, serif",
  "Georgia": "Georgia, Times New Roman, serif",
  "Palatino": "Palatino Linotype, Book Antiqua, serif",
  "Garamond": "Garamond, Georgia, serif",
  "Helvetica": "Helvetica, Arial, sans-serif",
  "Arial": "Arial, Helvetica, sans-serif",
  "Verdana": "Verdana, Geneva, sans-serif",
  "Tahoma": "Tahoma, Geneva, sans-serif",
  "Calibri": "Calibri, Arial, sans-serif",
  "Trebuchet": "Trebuchet MS, Helvetica, sans-serif",
  "Century": "Century Gothic, Arial, sans-serif",
  "Courier": "Courier New, Courier, monospace",
  "CourierNew": "Courier New, Courier, monospace",
  "Consolas": "Consolas, Monaco, monospace",
  "Monaco": "Monaco, Consolas, monospace",
};

function cleanFontName(rawName: string): string {
  let name = rawName;
  const plusIdx = name.indexOf("+");
  if (plusIdx !== -1) {
    name = name.substring(plusIdx + 1);
  }
  name = name.replace(/[-,]?(Bold|Italic|Oblique|Light|Medium|Regular|Roman|Book)$/i, "");
  name = name.replace(/-$/, "");
  return name.trim();
}

function getFallbackStack(fontName: string): string {
  const normalized = fontName.replace(/\s+/g, "");
  for (const [key, fallback] of Object.entries(FONT_FALLBACKS)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) {
      return fallback;
    }
  }
  if (/mono|code|courier|consolas/i.test(fontName)) {
    return "monospace";
  }
  if (/serif/i.test(fontName) && !/sans/i.test(fontName)) {
    return "Georgia, Times New Roman, serif";
  }
  return "system-ui, sans-serif";
}

function isBoldFont(rawName: string): boolean {
  return /bold/i.test(rawName);
}

function isItalicFont(rawName: string): boolean {
  return /italic|oblique/i.test(rawName);
}

export function generateFontCss(fonts: PdfFont[]): string {
  if (fonts.length === 0) return "";

  const cleanedFonts = new Map<string, { bold: boolean; italic: boolean }>();
  
  for (const font of fonts) {
    const cleanName = cleanFontName(font.name);
    if (!cleanName) continue;
    
    const existing = cleanedFonts.get(cleanName) || { bold: false, italic: false };
    if (isBoldFont(font.name)) existing.bold = true;
    if (isItalicFont(font.name)) existing.italic = true;
    cleanedFonts.set(cleanName, existing);
  }

  const cssRules: string[] = [];
  
  for (const [fontName, variants] of Array.from(cleanedFonts.entries())) {
    const fallback = getFallbackStack(fontName);
    
    cssRules.push(`@font-face {
  font-family: "${fontName}";
  src: local("${fontName}"), local("${fontName.replace(/\s+/g, "")}");
  font-display: swap;
}`);

    if (variants.bold) {
      cssRules.push(`@font-face {
  font-family: "${fontName}";
  src: local("${fontName} Bold"), local("${fontName.replace(/\s+/g, "")}-Bold");
  font-weight: bold;
  font-display: swap;
}`);
    }

    if (variants.italic) {
      cssRules.push(`@font-face {
  font-family: "${fontName}";
  src: local("${fontName} Italic"), local("${fontName.replace(/\s+/g, "")}-Italic");
  font-style: italic;
  font-display: swap;
}`);
    }

    cssRules.push(`:root {
  --pdf-font-${fontName.toLowerCase().replace(/\s+/g, "-")}: "${fontName}", ${fallback};
}`);
  }

  const primaryFont = Array.from(cleanedFonts.keys())[0];
  if (primaryFont) {
    const fallback = getFallbackStack(primaryFont);
    cssRules.push(`body {
  font-family: "${primaryFont}", ${fallback};
}`);
  }

  return cssRules.join("\n\n");
}
