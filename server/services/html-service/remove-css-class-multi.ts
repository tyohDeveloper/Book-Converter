import { type ManagedFile } from "../../lib/file-manager/types";
import { logger } from "../../common/logger";
import { loadHtmlDocument, saveFormattedOutput } from "./html-pipeline";
import { buildDeleteInstruction } from "../../lib/css/extract-instructions";

const log = logger.child({ service: "html-remove-class-multi" });

export interface RemoveClassMultiResult {
  files: ManagedFile[];
  totalElementsUpdated: number;
}

async function removeClassFromFile(
  sessionId: string,
  fileId: string,
  className: string
): Promise<{ file: ManagedFile; elementsUpdated: number }> {
  const cleanClass = className.replace(/^\./, '').trim();
  const { file, dom, doc, head, isAlreadyFormatted } = await loadHtmlDocument(sessionId, fileId);

  const elementsWithClass = doc.querySelectorAll(`.${cleanClass}`);
  let elementsUpdated = 0;

  elementsWithClass.forEach((el) => {
    el.classList.remove(cleanClass);
    if (el.classList.length === 0) {
      el.removeAttribute('class');
    }
    elementsUpdated++;
  });

  const styleEl = head.querySelector("style");
  if (styleEl) {
    const css = styleEl.textContent || "";
    const classPattern = new RegExp(`\\.${cleanClass}(?![a-zA-Z0-9_-])\\s*\\{[^}]*\\}\\s*`, 'g');
    styleEl.textContent = css.replace(classPattern, '');
  }

  const instruction = buildDeleteInstruction(cleanClass);
  const comment = doc.createComment(instruction.slice(4, -3));
  head.appendChild(comment);

  const outputFile = await saveFormattedOutput({
    sessionId,
    fileId,
    dom,
    originalName: file.originalName,
    isAlreadyFormatted,
    prefix: "html-remove-class-multi",
  });

  return { file: outputFile, elementsUpdated };
}

export async function removeCssClassMulti(
  sessionId: string,
  fileIds: string[],
  className: string
): Promise<RemoveClassMultiResult> {
  log.info("Removing CSS class from multiple files", { fileCount: fileIds.length, className });

  const cleanClass = className.replace(/^\./, '').trim();
  if (!cleanClass) {
    throw new Error("Class name cannot be empty");
  }

  const files: ManagedFile[] = [];
  let totalElementsUpdated = 0;

  for (const fileId of fileIds) {
    const { file, elementsUpdated } = await removeClassFromFile(sessionId, fileId, cleanClass);
    files.push(file);
    totalElementsUpdated += elementsUpdated;
  }

  log.info("CSS class removed from multiple files", { className: cleanClass, fileCount: files.length, totalElementsUpdated });
  return { files, totalElementsUpdated };
}
