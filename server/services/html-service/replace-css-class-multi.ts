import { type ManagedFile } from "../../lib/file-manager/types";
import { logger } from "../../common/logger";
import { loadHtmlDocument, saveFormattedOutput } from "./html-pipeline";
import { buildReplaceInstruction } from "../../lib/css/extract-instructions";

const log = logger.child({ service: "html-replace-class-multi" });

export interface ReplaceClassMultiResult {
  files: ManagedFile[];
  totalElementsUpdated: number;
}

async function replaceClassInFile(
  sessionId: string,
  fileId: string,
  sourceClass: string,
  targetClass: string
): Promise<{ file: ManagedFile; elementsUpdated: number }> {
  const cleanSource = sourceClass.replace(/^\./, '').trim();
  const cleanTarget = targetClass.replace(/^\./, '').trim();
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
    styleEl.textContent = css.replace(sourcePattern, `.${cleanTarget}`);
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
    prefix: "html-replace-class-multi",
  });

  return { file: outputFile, elementsUpdated };
}

export async function replaceCssClassMulti(
  sessionId: string,
  fileIds: string[],
  sourceClass: string,
  targetClass: string
): Promise<ReplaceClassMultiResult> {
  log.info("Replacing CSS class in multiple files", { fileCount: fileIds.length, sourceClass, targetClass });

  const cleanSource = sourceClass.replace(/^\./, '').trim();
  const cleanTarget = targetClass.replace(/^\./, '').trim();

  if (!cleanSource || !cleanTarget) {
    throw new Error("Source and target classes cannot be empty");
  }

  if (cleanSource === cleanTarget) {
    throw new Error("Source and target classes must be different");
  }

  const files: ManagedFile[] = [];
  let totalElementsUpdated = 0;

  for (const fileId of fileIds) {
    const { file, elementsUpdated } = await replaceClassInFile(sessionId, fileId, cleanSource, cleanTarget);
    files.push(file);
    totalElementsUpdated += elementsUpdated;
  }

  log.info("CSS class replaced in multiple files", { sourceClass: cleanSource, targetClass: cleanTarget, fileCount: files.length, totalElementsUpdated });
  return { files, totalElementsUpdated };
}
