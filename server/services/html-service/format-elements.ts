import { type ManagedFile } from "../../lib/file-manager/types";
import { logger } from "../../common/logger";
import type { ElementOperation, HtmlElement } from "@shared/contracts/html";
import { collectFormattableElements, findPreviousFormattableElement } from "./element-collector";
import { splitElementAtPosition } from "./split-element";
import { insertBreakAtPosition } from "./insert-break";
import { mergeWithPreviousElement } from "./merge-element";
import { wrapTextRange } from "./wrap-text-range";
import { changeElementTag } from "./change-element-tag";
import { addElementStyle } from "./add-element-style";
import { updateElementContent } from "./update-element-content";
import { loadHtmlDocument, saveFormattedOutput } from "./html-pipeline";

const log = logger.child({ service: "html-format" });

export interface FormatResult {
  file: ManagedFile;
}

export interface PreviewResult {
  elements: HtmlElement[];
}

export async function getHtmlElements(
  sessionId: string,
  fileId: string
): Promise<PreviewResult> {
  const { body } = await loadHtmlDocument(sessionId, fileId);

  const formattable = collectFormattableElements(body);
  const elements: HtmlElement[] = formattable.map((el, index) => {
    const fullText = el.textContent || "";
    const trimmed = fullText.trim();
    return {
      index,
      tag: el.tagName.toLowerCase(),
      text: trimmed.substring(0, 200) + (trimmed.length > 200 ? "..." : ""),
      fullText,
      innerHTML: el.innerHTML,
      style: el.getAttribute("style") || undefined,
    };
  });

  return { elements };
}

function applyOperation(
  op: ElementOperation,
  el: Element,
  formattableElements: Element[],
  doc: Document,
  body: Element
): Element[] {
  switch (op.action) {
    case "changeTag":
      if (op.newTag) {
        const newEl = changeElementTag(el, op.newTag, doc);
        formattableElements[op.index] = newEl;
      }
      break;

    case "addStyle":
      if (op.style) {
        addElementStyle(el, op.style);
      }
      break;

    case "split":
      if (typeof op.position === "number") {
        const newEl = splitElementAtPosition(el, op.position, doc);
        if (newEl) {
          return collectFormattableElements(body);
        }
      }
      break;

    case "insertBreak":
      if (typeof op.position === "number") {
        insertBreakAtPosition(el, op.position, doc);
      }
      break;

    case "mergeWithPrevious": {
      const prev = findPreviousFormattableElement(el, formattableElements);
      if (prev) {
        mergeWithPreviousElement(el, prev);
        return collectFormattableElements(body);
      }
      break;
    }

    case "wrap":
      if (op.range && op.wrapKind) {
        wrapTextRange(el, op.range.start, op.range.end, op.wrapKind, op.wrapStyle, doc);
      }
      break;

    case "updateContent":
      if (typeof op.content === "string") {
        updateElementContent(el, op.content);
      }
      break;

    case "insertAfter":
      if (op.insertTag) {
        const newEl = doc.createElement(op.insertTag.toUpperCase());
        newEl.textContent = op.insertContent || "";
        el.parentNode?.insertBefore(newEl, el.nextSibling);
        return collectFormattableElements(body);
      }
      break;
  }
  
  return formattableElements;
}

function applyOperationsToDocument(
  operations: ElementOperation[],
  doc: Document,
  body: HTMLElement
): void {
  let formattableElements = collectFormattableElements(body);

  const deleteIndices = new Set<number>();
  for (const op of operations) {
    if (op.action === "delete") {
      deleteIndices.add(op.index);
    }
  }

  for (const op of operations) {
    const el = formattableElements[op.index];
    if (!el) continue;
    if (deleteIndices.has(op.index) && op.action !== "delete") continue;
    
    formattableElements = applyOperation(op, el, formattableElements, doc, body);
  }

  for (const idx of Array.from(deleteIndices).sort((a, b) => b - a)) {
    const el = formattableElements[idx];
    if (el) el.remove();
  }
}

export async function formatHtmlElements(
  sessionId: string,
  fileId: string,
  operations: ElementOperation[]
): Promise<FormatResult> {
  log.info("Formatting HTML elements", { fileId, operationCount: operations.length });

  const { file, dom, doc, body, isAlreadyFormatted } = await loadHtmlDocument(sessionId, fileId);

  applyOperationsToDocument(operations, doc, body);

  const outputFile = await saveFormattedOutput({
    sessionId,
    fileId,
    dom,
    originalName: file.originalName,
    isAlreadyFormatted,
    normalize: false,
    prefix: "html-format",
  });

  log.info("HTML formatting complete", { outputName: outputFile.originalName });
  return { file: outputFile };
}
