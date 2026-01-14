import type { TypographySettings } from "@shared/contracts/settings";
import { getFontFamily, getHeadingFontFamily } from "./font-config";

export function getBaseStyles(t: TypographySettings): string {
  const fontFamily = getFontFamily(t.fontFamily);
  const headingFontFamily = getHeadingFontFamily(t.fontFamily);
  const headingFontSize = `${t.headingSize}em`;

  return `body {
  font-family: ${fontFamily};
  font-size: ${t.fontSize}px;
  line-height: ${t.lineHeight};
  margin: ${t.pageMargin}px;
  text-align: ${t.textAlign};
}

h1, h2, h3, h4, h5, h6 {
  font-family: ${headingFontFamily};
  margin-top: 2em;
  margin-bottom: 1em;
  text-align: left;
}

h2.chapter-heading {
  font-size: ${headingFontSize};
}

p {
  margin: ${t.paragraphSpacing}em 0;
  text-indent: ${t.firstLineIndent}em;
}

p:first-of-type {
  text-indent: 0;
}

/* Blockquotes */
blockquote {
  margin: 1em 2em;
  padding-left: 1em;
  border-left: 3px solid #ccc;
  font-style: italic;
}

/* Lists with indentation */
.indented {
  margin-left: 2em;
}

.indented-2 {
  margin-left: 4em;
}

/* Chapter headings with page breaks */
.chapter-heading {
  font-weight: bold;
  font-size: ${headingFontSize};
  margin-top: 2em;
  margin-bottom: 1em;
  page-break-before: always;
}

/* Text styling */
em, i {
  font-style: italic;
}

strong, b {
  font-weight: bold;
}

em strong, strong em, i b, b i {
  font-style: italic;
  font-weight: bold;
}`;
}
