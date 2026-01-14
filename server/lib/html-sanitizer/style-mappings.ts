export interface StyleMapping {
  pattern: RegExp;
  className: string;
  css: string;
}

export const STYLE_MAPPINGS: StyleMapping[] = [
  { pattern: /text-align:\s*center/i, className: "text-center", css: ".text-center { text-align: center; }" },
  { pattern: /text-align:\s*right/i, className: "text-right", css: ".text-right { text-align: right; }" },
  { pattern: /text-align:\s*justify/i, className: "text-justify", css: ".text-justify { text-align: justify; }" },
  { pattern: /text-indent:\s*[^;]+/i, className: "indent", css: ".indent { text-indent: 1.5em; }" },
  { pattern: /margin-left:\s*[^;]+/i, className: "indent-left", css: ".indent-left { margin-left: 2em; }" },
  { pattern: /font-style:\s*italic/i, className: "italic", css: ".italic { font-style: italic; }" },
  { pattern: /font-weight:\s*(bold|[6-9]00)/i, className: "bold", css: ".bold { font-weight: bold; }" },
  { pattern: /line-height:\s*1\.[2-5]/i, className: "line-normal", css: ".line-normal { line-height: 1.4; }" },
  { pattern: /margin-top:\s*0p[tx]/i, className: "mt-0", css: ".mt-0 { margin-top: 0; }" },
  { pattern: /margin-bottom:\s*[0-5]p[tx]/i, className: "mb-sm", css: ".mb-sm { margin-bottom: 0.25em; }" },
  { pattern: /white-space:\s*pre-wrap/i, className: "ws-pre", css: ".ws-pre { white-space: pre-wrap; }" },
  { pattern: /font-size:\s*12\s*pt/i, className: "font-body", css: ".font-body { font-size: 12pt; }" },
];

export const NOISE_STYLE_PATTERNS: RegExp[] = [
  /orphans:\s*\d+/i,
  /widows:\s*\d+/i,
  /letter-spacing:\s*normal/i,
  /word-spacing:\s*0px/i,
  /text-transform:\s*none/i,
  /text-decoration-line:\s*none/i,
  /text-decoration-style:\s*solid/i,
  /text-decoration-thickness:\s*auto/i,
  /text-decoration:\s*none/i,
  /font-variant-ligatures:\s*normal/i,
  /font-variant-caps:\s*normal/i,
  /font-variant-alternates:\s*normal/i,
  /font-variant-numeric:\s*normal/i,
  /font-variant-east-asian:\s*normal/i,
  /font-variant-position:\s*normal/i,
  /-webkit-tap-highlight-color:[^;]+/i,
  /-webkit-text-size-adjust:[^;]+/i,
  /-webkit-text-stroke-width:\s*0px/i,
  /caret-color:[^;]+/i,
  /white-space:\s*normal/i,
  /vertical-align:\s*baseline/i,
  /background-color:\s*transparent/i,
  /font-weight:\s*(normal|400)/i,
  /font-style:\s*normal/i,
  /text-align:\s*(start|left)/i,
  /color:\s*(rgb\s*\(\s*0\s*,\s*0\s*,\s*0\s*\)|#000(?:000)?|black)/i,
  /font-family:\s*["']?\s*Times New Roman\s*["']?\s*,?\s*serif/i,
  /font-family:\s*serif/i,
  /font-family:\s*["']?\s*Arial\s*["']?\s*,?\s*sans-serif/i,
];

export function isNoiseStyle(part: string): boolean {
  return NOISE_STYLE_PATTERNS.some(p => p.test(part));
}

export function generateCssFromClasses(usedClasses: Set<string>): string {
  const cssRules: string[] = [];
  for (const mapping of STYLE_MAPPINGS) {
    if (usedClasses.has(mapping.className)) {
      cssRules.push(mapping.css);
    }
  }
  return cssRules.join("\n");
}
