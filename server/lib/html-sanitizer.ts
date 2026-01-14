import DOMPurify from "isomorphic-dompurify";
import { generateCssFromClasses } from "./html-sanitizer/style-mappings";
import { extractInlineStylesToClasses } from "./html-sanitizer/inline-style-extractor";

export interface SanitizeOptions {
  skipCss?: boolean;
}

export interface SanitizeResult {
  html: string;
  css: string;
}

function removeUnnecessaryAttributes(html: string): string {
  return html
    .replace(/\s+id="[^"]*"/gi, "")
    .replace(/\s+dir="ltr"/gi, "")
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, "");
}

function removeEmptyStyleAttributes(html: string): string {
  return html.replace(/\s+style="\s*"/gi, "");
}

export function sanitizeHtmlContent(html: string, options: SanitizeOptions = {}): SanitizeResult {
  const { skipCss = false } = options;
  
  let preProcessed = html;
  
  let sanitized = DOMPurify.sanitize(preProcessed, {
    FORBID_TAGS: ["script", "noscript", "iframe", "object", "embed", "form", "input", "button", "video", "audio", "source", "track", "canvas", "svg", "math", "link", "meta", "base"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit", "onkeydown", "onkeyup", "onkeypress", "srcset", "data-src"],
    ALLOW_DATA_ATTR: false,
    WHOLE_DOCUMENT: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: true,
  });
  
  sanitized = sanitized.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, "<span>$1</span>");
  sanitized = sanitized.replace(/<img[^>]*>/gi, "");
  sanitized = sanitized.replace(/color:\s*(white|#fff(?:fff)?|rgb\s*\(\s*255\s*,\s*255\s*,\s*255\s*\))/gi, "color: black");
  sanitized = sanitized.replace(/background-image:\s*url\([^)]*\)/gi, "");
  
  sanitized = removeUnnecessaryAttributes(sanitized);
  sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  if (skipCss) {
    sanitized = sanitized.replace(/\s*style="[^"]*"/gi, "");
    sanitized = sanitized.replace(/\s*class="[^"]*"/gi, "");
    return { html: sanitized, css: "" };
  }
  
  const { html: convertedHtml, cssClasses } = extractInlineStylesToClasses(sanitized);
  sanitized = convertedHtml;
  sanitized = removeEmptyStyleAttributes(sanitized);
  
  const css = cssClasses.size > 0 ? generateCssFromClasses(cssClasses) : "";
  
  return { html: sanitized, css };
}
