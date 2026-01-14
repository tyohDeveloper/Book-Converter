import { type ManagedFile } from "../../lib/file-manager/types";
import { logger } from "../../common/logger";
import { loadHtmlDocument, saveFormattedOutput } from "./html-pipeline";
import { buildReplaceInstruction } from "../../lib/css/extract-instructions";

const log = logger.child({ service: "html-replace-class" });

export interface ReplaceClassResult {
  file: ManagedFile;
  elementsUpdated: number;
}

export async function replaceCssClass(
  sessionId: string,
  fileId: string,
  sourceClass: string,
  targetClass: string
): Promise<ReplaceClassResult> {
  log.info("Replacing CSS class", { fileId, sourceClass, targetClass });

  const cleanSource = sourceClass.replace(/^\./, '').trim();
  const cleanTarget = targetClass.replace(/^\./, '').trim();

  if (!cleanSource || !cleanTarget) {
    throw new Error("Source and target classes cannot be empty");
  }

  if (cleanSource === cleanTarget) {
    throw new Error("Source and target classes must be different");
  }

  const { file, dom, doc, head, isAlreadyFormatted } = await loadHtmlDocument(sessionId, fileId);

  const elementsWithClass = doc.querySelectorAll(`.${cleanSource}`);
  let elementsUpdated = 0;

  elementsWithClass.forEach((el) => {
    el.classList.remove(cleanSource);
    el.classList.add(cleanTarget);
    elementsUpdated++;
  });

  const styleEl = head.querySelector("style");
  if (styleEl) {
    const css = styleEl.textContent || "";
    const sourcePattern = new RegExp(`\\.${cleanSource}(?![a-zA-Z0-9_-])`, 'g');
    const updatedCss = css.replace(sourcePattern, `.${cleanTarget}`);
    styleEl.textContent = updatedCss;
  }

  const instruction = buildReplaceInstruction(cleanSource, cleanTarget);
  const comment = doc.createComment(instruction.slice(4, -3));
  head.appendChild(comment);

  const outputFile = await saveFormattedOutput({
    sessionId,
    fileId,
    dom,
    originalName: file.originalName,
    isAlreadyFormatted,
    prefix: "html-replace-class",
  });

  log.info("CSS class replaced", { sourceClass: cleanSource, targetClass: cleanTarget, elementsUpdated });
  return { file: outputFile, elementsUpdated };
}
