import type { PdfDesignRules, PageNumberSettings, TypographyRules, PageBreakRules } from "@shared/contracts/pdf-design-rules";

function buildPageNumberCss(settings: PageNumberSettings): string {
  if (!settings.enabled) return "";

  const positionMap: Record<string, { marginPosition: string; textAlign: string }> = {
    "bottom-center": { marginPosition: "@bottom-center", textAlign: "center" },
    "bottom-left": { marginPosition: "@bottom-left", textAlign: "left" },
    "bottom-right": { marginPosition: "@bottom-right", textAlign: "right" },
    "top-center": { marginPosition: "@top-center", textAlign: "center" },
    "top-left": { marginPosition: "@top-left", textAlign: "left" },
    "top-right": { marginPosition: "@top-right", textAlign: "right" },
  };

  const formatMap: Record<string, string> = {
    "numeric": "decimal",
    "roman-lower": "lower-roman",
    "roman-upper": "upper-roman",
    "alpha-lower": "lower-alpha",
    "alpha-upper": "upper-alpha",
  };

  const pos = positionMap[settings.position || "bottom-center"] || positionMap["bottom-center"];
  const format = formatMap[settings.format || "numeric"] || "decimal";
  const prefix = settings.prefix || "";
  const suffix = settings.suffix || "";
  const fontFamily = settings.fontFamily ? `font-family: ${settings.fontFamily};` : "";
  const fontSize = settings.fontSize || "10pt";

  const startNumber = settings.startNumber ?? 1;
  const counterStart = startNumber !== 1 ? `counter-reset: page ${startNumber - 1};` : "";

  let css = `@page {
  ${pos.marginPosition} {
    content: "${prefix}" counter(page, ${format}) "${suffix}";
    font-size: ${fontSize};
    ${fontFamily}
  }
}
`;

  if (settings.skipFirstPage) {
    css += `@page :first {
  ${pos.marginPosition} {
    content: none;
  }
}
`;
  }

  if (counterStart) {
    css += `body { ${counterStart} }
`;
  }

  return css;
}

function buildTypographyCss(rules: TypographyRules): string {
  const parts: string[] = [];

  if (rules.preventOrphans || rules.preventWidows) {
    const orphans = rules.preventOrphans ? `orphans: ${rules.orphanLines ?? 2};` : "";
    const widows = rules.preventWidows ? `widows: ${rules.widowLines ?? 2};` : "";
    parts.push(`p, li, dd, dt { ${orphans} ${widows} }`);
  }

  if (rules.noWordSplitting) {
    parts.push(`p, span, li { overflow-wrap: break-word; word-break: keep-all; hyphens: none; }`);
  } else if (rules.hyphensMode === "auto") {
    parts.push(`p, span, li { hyphens: auto; -webkit-hyphens: auto; }`);
  } else if (rules.hyphensMode === "manual") {
    parts.push(`p, span, li { hyphens: manual; -webkit-hyphens: manual; }`);
  }

  if (rules.keepHeadingsWithContent) {
    parts.push(`h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }`);
    parts.push(`h1 + *, h2 + *, h3 + *, h4 + *, h5 + *, h6 + * { page-break-before: avoid; break-before: avoid; }`);
  }

  return parts.join("\n");
}

function buildPageBreakCss(rules: PageBreakRules): string {
  const parts: string[] = [];

  if (rules.avoidBreakInsideBlocks) {
    parts.push(`blockquote, pre, figure, table, ul, ol { page-break-inside: avoid; break-inside: avoid; }`);
  }

  if (rules.avoidBreakAfterHeadings) {
    parts.push(`h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }`);
  }

  if (rules.chapterStartsNewPage) {
    parts.push(`.chapter, [class*="chapter"], h1 { page-break-before: always; break-before: page; }`);
    parts.push(`body > h1:first-child, .chapter:first-child { page-break-before: avoid; break-before: avoid; }`);
  }

  return parts.join("\n");
}

export function buildPrintCss(rules: PdfDesignRules): string {
  const parts: string[] = [];

  parts.push("@media print {");

  if (rules.pageNumbers) {
    parts.push(buildPageNumberCss(rules.pageNumbers));
  }

  if (rules.typography) {
    parts.push(buildTypographyCss(rules.typography));
  }

  if (rules.pageBreaks) {
    parts.push(buildPageBreakCss(rules.pageBreaks));
  }

  parts.push("}");

  return parts.filter(p => p.trim()).join("\n\n");
}
