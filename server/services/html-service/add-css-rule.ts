import { type ManagedFile } from "../../lib/file-manager/types";
import { logger } from "../../common/logger";
import { loadHtmlDocument, saveFormattedOutput, getOrCreateStyleElement } from "./html-pipeline";

const log = logger.child({ service: "html-add-rule" });

export interface AddRuleResult {
  file: ManagedFile;
  selector: string;
}

export async function addCssRule(
  sessionId: string,
  fileId: string,
  selector: string
): Promise<AddRuleResult> {
  log.info("Adding CSS rule", { fileId, selector });

  const cleanSelector = selector.trim();
  if (!cleanSelector) {
    throw new Error("Selector cannot be empty");
  }

  const { file, dom, doc, head, isAlreadyFormatted } = await loadHtmlDocument(sessionId, fileId);
  const styleEl = getOrCreateStyleElement(doc, head);
  const existingCss = styleEl.textContent || "";

  const selectorPattern = new RegExp(
    `^\\s*${cleanSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`,
    'm'
  );
  if (selectorPattern.test(existingCss)) {
    throw new Error(`Rule for "${cleanSelector}" already exists`);
  }

  const newRule = `${cleanSelector} {\n  /* Add declarations here */\n}`;
  const separator = existingCss.trim() ? "\n\n" : "";
  styleEl.textContent = existingCss + separator + newRule;

  const outputFile = await saveFormattedOutput({
    sessionId,
    fileId,
    dom,
    originalName: file.originalName,
    isAlreadyFormatted,
    prefix: "html-add-rule",
  });

  log.info("CSS rule added", { selector: cleanSelector });
  return { file: outputFile, selector: cleanSelector };
}
