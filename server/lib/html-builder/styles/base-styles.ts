import type { TypographySettings } from "@shared/contracts/settings";
import { getFontFamily } from "./font-map";

export function getBaseStyles(t: TypographySettings): string {
  const fontFamily = getFontFamily(t.fontFamily);

  return `
body {
  font-family: ${fontFamily};
  font-size: ${t.fontSize}px;
  line-height: ${t.lineHeight};
  max-width: 800px;
  margin: 0 auto;
  padding: ${t.pageMargin}px;
  background-color: #f9f9f9;
  color: #333;
}
h1 {
  text-align: center;
  font-size: 2em;
  margin-bottom: 30px;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}
p {
  margin: ${t.paragraphSpacing}em 0;
  text-align: ${t.textAlign};
  text-indent: ${t.firstLineIndent}em;
}
p:first-of-type {
  text-indent: 0;
}
p.scene-break {
  margin: 0;
  height: 1em;
  text-indent: 0;
}
em, i { font-style: italic; }
strong, b { font-weight: bold; }
em strong, strong em, i b, b i { font-style: italic; font-weight: bold; }
`;
}
