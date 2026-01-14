import { type ManagedFile } from "../../lib/file-manager/types";
import { logger } from "../../common/logger";
import { loadHtmlDocument, saveFormattedOutput, getOrCreateStyleElement } from "./html-pipeline";
import { consolidateMultiClassElements } from "./consolidate-multi-class";
import { extractInlineStylesToClasses, buildStyleToClassMap } from "./extract-inline-styles";
import { removeClassesFromStylesheet, removeClassesFromElements } from "./remove-class-core";
import { buildDeleteInstruction } from "../../lib/css/extract-instructions";

const log = logger.child({ service: "html-simplify" });

export interface SimplifyResult {
  file: ManagedFile;
  classesCreated: number;
  elementsUpdated: number;
}

export async function simplifyInlineStyles(
  sessionId: string,
  fileId: string
): Promise<SimplifyResult> {
  log.info("Simplifying styles", { fileId });

  const { file, dom, doc, head, isAlreadyFormatted } = await loadHtmlDocument(sessionId, fileId);
  const styleEl = getOrCreateStyleElement(doc, head);
  const existingCss = styleEl.textContent || "";

  const consolidateResult = consolidateMultiClassElements(doc, existingCss);
  const styleToClassMap = buildStyleToClassMap(consolidateResult.classMap);
  const extractResult = extractInlineStylesToClasses(doc, existingCss, styleToClassMap);

  const allNewRules = [...consolidateResult.newRules, ...extractResult.newRules];
  if (allNewRules.length > 0) {
    const separator = existingCss.trim() ? "\n\n/* Simplified styles */\n" : "";
    styleEl.textContent = existingCss + separator + allNewRules.join("\n");
  }

  const outputFile = await saveFormattedOutput({
    sessionId,
    fileId,
    dom,
    originalName: file.originalName,
    isAlreadyFormatted,
    prefix: "html-simplify",
  });

  const classesCreated = consolidateResult.newRules.length + extractResult.newRules.length;
  const elementsUpdated = consolidateResult.elementsUpdated + extractResult.elementsUpdated;

  log.info("Styles simplified", { classesCreated, elementsUpdated });
  return { file: outputFile, classesCreated, elementsUpdated };
}

export interface RemoveClassResult {
  file: ManagedFile;
  elementsUpdated: number;
}

export async function removeCssClass(
  sessionId: string,
  fileId: string,
  className: string
): Promise<RemoveClassResult> {
  return removeCssClasses(sessionId, fileId, [className]);
}

export interface RemoveClassesResult {
  file: ManagedFile;
  classesRemoved: number;
  elementsUpdated: number;
}

export async function removeCssClasses(
  sessionId: string,
  fileId: string,
  classNames: string[]
): Promise<RemoveClassesResult> {
  log.info("Removing CSS classes", { fileId, count: classNames.length });

  const { file, dom, doc, head, isAlreadyFormatted } = await loadHtmlDocument(sessionId, fileId);

  const styleEl = head.querySelector("style");
  let classesRemoved = 0;
  if (styleEl) {
    const css = styleEl.textContent || "";
    const result = removeClassesFromStylesheet(css, classNames);
    styleEl.textContent = result.updatedCss;
    classesRemoved = result.classesRemoved;
  }

  const elementsUpdated = removeClassesFromElements(doc, classNames);

  for (const className of classNames) {
    const instruction = buildDeleteInstruction(className);
    const comment = doc.createComment(instruction.slice(4, -3));
    head.appendChild(comment);
  }

  const outputFile = await saveFormattedOutput({
    sessionId,
    fileId,
    dom,
    originalName: file.originalName,
    isAlreadyFormatted,
    prefix: "html-simplify",
  });

  log.info("CSS classes removed", { classesRemoved, elementsUpdated });
  return { file: outputFile, classesRemoved, elementsUpdated };
}
