import fs from "fs/promises";
import { JSDOM } from "jsdom";
import { fileManager } from "../../lib/file-manager/file-manager";
import { isHtmlFile } from "../../lib/file-manager/is-html-file";
import { ConversionError } from "../../common/errors/specific-errors";
import { toCanonicalStyle, declarationsToString } from "../../lib/css/parse-declarations";
import { parseClassDeclarations } from "../../lib/css/parse-class-rules";
import { deduplicateCss } from "../../lib/css/deduplicate-css";
import { parseStylesheet } from "../../lib/css/parse-stylesheet";
import { sortAndFormatCss } from "../../lib/css/sort-and-format-css";
import type { CssEditorState, InlineStyleInfo, SelectorUsage, ParsedStylesheet } from "@shared/contracts/css-editor";

export type { InlineStyleInfo, SelectorUsage };

export interface CssStylesResult extends CssEditorState {}

function extractInlineStyles(doc: Document): InlineStyleInfo[] {
  const styleGroups = new Map<string, { style: string; count: number }>();
  
  const elementsWithStyle = doc.querySelectorAll('[style]');
  for (const el of Array.from(elementsWithStyle)) {
    const style = el.getAttribute('style');
    if (!style) continue;
    
    const canonical = toCanonicalStyle(style);
    if (!canonical) continue;
    
    const existing = styleGroups.get(canonical);
    if (existing) {
      existing.count++;
    } else {
      styleGroups.set(canonical, { style: canonical, count: 1 });
    }
  }
  
  const results: InlineStyleInfo[] = [];
  let index = 1;
  for (const [, info] of Array.from(styleGroups.entries()).sort((a, b) => b[1].count - a[1].count)) {
    results.push({
      selector: `[inline-style-${index}]`,
      style: info.style,
      count: info.count,
      type: 'inline',
    });
    index++;
  }
  
  return results;
}

function extractMultiClassStyles(doc: Document, css: string): InlineStyleInfo[] {
  const classMap = parseClassDeclarations(css);
  const multiClassMap = new Map<string, { classes: string[]; style: string; count: number }>();
  
  const allElements = doc.querySelectorAll('[class]');
  for (const el of Array.from(allElements)) {
    const classAttr = el.getAttribute('class') || '';
    const classes = classAttr.split(/\s+/).filter(Boolean);
    
    if (classes.length < 2) continue;
    
    const resolvedClasses = classes.filter(c => classMap.has(c));
    if (resolvedClasses.length < 2) continue;
    
    const key = resolvedClasses.sort().join(' ');
    const existing = multiClassMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      const classesWithOrder = resolvedClasses
        .map(cls => ({ cls, info: classMap.get(cls)! }))
        .sort((a, b) => a.info.lastOrder - b.info.lastOrder);
      
      const merged: Record<string, string> = {};
      for (const { info } of classesWithOrder) {
        Object.assign(merged, info.declarations);
      }
      const style = declarationsToString(merged);
      multiClassMap.set(key, { classes: resolvedClasses, style, count: 1 });
    }
  }
  
  const results: InlineStyleInfo[] = [];
  let index = 1;
  for (const [, info] of Array.from(multiClassMap.entries()).sort((a, b) => b[1].count - a[1].count)) {
    results.push({
      selector: `[multi-class-${index}] .${info.classes.join('.')}`,
      style: info.style,
      count: info.count,
      type: 'multiclass',
    });
    index++;
  }
  
  return results;
}

function extractDuplicateClasses(css: string): InlineStyleInfo[] {
  const classMap = parseClassDeclarations(css);
  const styleToClasses = new Map<string, string[]>();
  
  for (const [className, info] of Array.from(classMap.entries())) {
    const styleStr = declarationsToString(info.declarations);
    if (!styleStr) continue;
    
    const existing = styleToClasses.get(styleStr);
    if (existing) {
      existing.push(className);
    } else {
      styleToClasses.set(styleStr, [className]);
    }
  }
  
  const results: InlineStyleInfo[] = [];
  let index = 1;
  for (const [style, classes] of Array.from(styleToClasses.entries())) {
    if (classes.length < 2) continue;
    results.push({
      selector: `[duplicate-${index}] ${classes.map(c => '.' + c).join(', ')}`,
      style,
      count: classes.length,
      type: 'duplicate',
    });
    index++;
  }
  
  return results;
}

function countSelectorUsage(doc: Document, css: string): SelectorUsage[] {
  const results: SelectorUsage[] = [];
  
  const selectorRegex = /([^{]+)\s*\{[^}]*\}/g;
  let match;
  const selectors = new Set<string>();
  
  while ((match = selectorRegex.exec(css)) !== null) {
    const selectorPart = match[1].trim();
    for (const sel of selectorPart.split(',')) {
      const trimmed = sel.trim();
      if (trimmed && !trimmed.startsWith('@') && !trimmed.startsWith(':root')) {
        selectors.add(trimmed);
      }
    }
  }
  
  for (const selector of Array.from(selectors)) {
    try {
      const elements = doc.querySelectorAll(selector);
      results.push({ selector, count: elements.length });
    } catch {
      results.push({ selector, count: 0 });
    }
  }
  
  return results;
}

export async function getCssStyles(
  sessionId: string,
  fileId: string
): Promise<CssStylesResult> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file || !isHtmlFile(file.originalName)) {
    throw new ConversionError("Invalid HTML file");
  }

  const tempPath = await fileManager.downloadToTempFile(sessionId, fileId);
  try {
    const content = await fs.readFile(tempPath, "utf8");
    const dom = new JSDOM(content);
    const doc = dom.window.document;

    const styleElements = doc.querySelectorAll("style");
    const rawStyles = Array.from(styleElements)
      .map(el => el.textContent || "")
      .join("\n");
    
    const dedupedStyles = deduplicateCss(rawStyles);
    const styles = sortAndFormatCss(dedupedStyles);
    const parsed = parseStylesheet(styles);
    
    const inlineStyles = extractInlineStyles(doc);
    const multiClassStyles = extractMultiClassStyles(doc, styles);
    const duplicateClasses = extractDuplicateClasses(styles);
    const selectorUsage = countSelectorUsage(doc, styles);

    return { 
      styles, 
      parsed,
      inlineStyles: [...inlineStyles, ...multiClassStyles, ...duplicateClasses], 
      selectorUsage 
    };
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}
