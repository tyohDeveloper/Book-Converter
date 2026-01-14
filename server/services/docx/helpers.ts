import mammoth from "mammoth";
import { buildFileToc as buildFileTocBase, toTocEntries } from "../../lib/html-builder/toc-builder";
import { logger } from "../../common/logger";
import type { DocxFileContent } from "./types";

const log = logger.child({ service: "docx" });

export async function extractHtmlFromDocx(docxPath: string): Promise<string> {
  const result = await mammoth.convertToHtml({ path: docxPath });
  
  if (result.messages.length > 0) {
    for (const msg of result.messages) {
      if (msg.type === "warning") {
        log.warn("DOCX conversion warning", { message: msg.message });
      } else if (msg.type === "error") {
        log.error("DOCX conversion error", { message: msg.message });
      }
    }
  }
  
  return result.value;
}

export function buildFileToc(fileContents: DocxFileContent[]): string {
  return buildFileTocBase(toTocEntries(fileContents));
}
