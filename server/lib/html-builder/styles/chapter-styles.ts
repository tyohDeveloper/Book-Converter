import type { TypographySettings } from "@shared/contracts/settings";

export function getChapterStyles(t: TypographySettings): string {
  const headingFontSize = `${t.headingSize}em`;

  return `
.chapter { margin-bottom: 2em; }
.chapter-heading {
  font-weight: bold;
  font-size: ${headingFontSize};
  margin-top: 2em;
  margin-bottom: 1em;
  color: #2c3e50;
  page-break-before: always;
  break-before: page;
}
section.chapter:first-of-type .chapter-heading {
  page-break-before: avoid;
  break-before: avoid;
}
.metadata {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  margin-bottom: 20px;
}
.file-separator {
  margin: 40px 0;
  border: none;
  border-top: 2px dashed #ccc;
}
`;
}
