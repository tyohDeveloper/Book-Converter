import type { TypographySettings } from "@shared/contracts/settings";

const fontMap: Record<TypographySettings["fontFamily"], string> = {
  serif: "Georgia, 'Times New Roman', serif",
  "sans-serif": "Arial, Helvetica, sans-serif",
  georgia: "Georgia, serif",
  times: "'Times New Roman', Times, serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  arial: "Arial, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
};

export function getFontFamily(font: TypographySettings["fontFamily"]): string {
  return fontMap[font] || fontMap.serif;
}
