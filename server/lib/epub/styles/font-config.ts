import type { TypographySettings } from "@shared/contracts/settings";

const FONT_MAP: Record<TypographySettings["fontFamily"], string> = {
  serif: "Georgia, serif",
  "sans-serif": "Arial, Helvetica, sans-serif",
  georgia: "Georgia, serif",
  times: "'Times New Roman', Times, serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  arial: "Arial, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
};

export function getFontFamily(font: TypographySettings["fontFamily"]): string {
  return FONT_MAP[font] || FONT_MAP.serif;
}

export function getHeadingFontFamily(font: TypographySettings["fontFamily"]): string {
  if (font === "sans-serif" || font === "arial" || font === "helvetica" || font === "verdana") {
    return getFontFamily(font);
  }
  return `"Libre Baskerville", ${getFontFamily(font)}`;
}
