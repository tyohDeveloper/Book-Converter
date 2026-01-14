import type { BookStylePreset } from "@shared/contracts/book-style-preset";

const FONT_MAP: Record<string, string> = {
  serif: "Georgia, serif",
  "sans-serif": "Arial, Helvetica, sans-serif",
  georgia: "Georgia, serif",
  times: "'Times New Roman', Times, serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  arial: "Arial, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
};

function getFontStack(font: string): string {
  return FONT_MAP[font] || FONT_MAP.serif;
}

export function buildBookStylesCss(preset: BookStylePreset): string {
  const bodyFont = getFontStack(preset.bodyFontFamily);
  const headingFont = getFontStack(preset.headingFontFamily);
  const hs = preset.headingScale;
  const toc = preset.tocStyle;

  return `
/* Book Style Preset: ${preset.name} */

body {
  font-family: ${bodyFont};
  font-size: ${preset.bodyFontSize}px;
  line-height: ${preset.lineHeight};
}

p {
  margin: ${preset.paragraphSpacing}em 0;
  text-indent: ${preset.firstLineIndent}em;
}

p:first-of-type,
h1 + p,
h2 + p,
h3 + p,
h4 + p,
h5 + p,
h6 + p {
  text-indent: 0;
}

/* Heading hierarchy */
h1, h2, h3, h4, h5, h6 {
  font-family: ${headingFont};
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.2;
}

h1 { font-size: ${hs.h1}em; }
h2 { font-size: ${hs.h2}em; }
h3 { font-size: ${hs.h3}em; }
h4 { font-size: ${hs.h4}em; }
h5 { font-size: ${hs.h5}em; }
h6 { font-size: ${hs.h6}em; }

h2.chapter-heading {
  font-size: ${hs.h2}em;
  page-break-before: always;
  margin-top: 2em;
}

/* Table of Contents styling */
nav.table-of-contents h2,
.toc-section h2 {
  font-family: ${headingFont};
  font-size: ${toc.titleSize}em;
  margin-bottom: 1em;
  ${toc.showDivider ? 'border-bottom: 1px solid #ccc; padding-bottom: 0.5em;' : ''}
}

nav.table-of-contents li,
.toc-entry {
  font-size: ${toc.entrySize}em;
  line-height: 1.6;
}

nav.table-of-contents a {
  color: inherit;
  text-decoration: none;
}

nav.table-of-contents a:hover {
  text-decoration: underline;
}
`.trim();
}
