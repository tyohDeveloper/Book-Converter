import { fileManager } from "../../lib/file-manager/file-manager";
import { isDocxFile } from "../../lib/file-manager/is-docx-file";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { extractHtmlFromDocx } from "./helpers";
import type { DocxFileContent } from "./types";

const log = logger.child({ service: "docx" });

export interface ExtractedDocxContents {
  fileContents: DocxFileContent[];
  firstFileName: string;
  tempFilePaths: string[];
}

export async function extractDocxContents(
  sessionId: string,
  fileIds: string[]
): Promise<ExtractedDocxContents> {
  const allFiles = await fileManager.getFilesByIds(sessionId, fileIds);
  const files = allFiles.filter(f => isDocxFile(f.originalName));
  
  if (files.length === 0) {
    throw new ConversionError("No DOCX files selected");
  }

  const fileContents: DocxFileContent[] = [];
  const tempFilePaths: string[] = [];
  const firstFileName = files[0].originalName.replace(/\.docx$/i, "");

  for (const file of files) {
    const docTitle = file.originalName.replace(/\.docx$/i, "");
    log.info("Extracting DOCX content", { fileName: file.originalName });

    const tempFilePath = await fileManager.downloadToTempFile(sessionId, file.id);
    tempFilePaths.push(tempFilePath);
    
    const rawHtml = await extractHtmlFromDocx(tempFilePath);
    const fileAnchor = `file-${file.id.replace(/[^a-z0-9]/gi, "-")}`;
    
    fileContents.push({ name: docTitle, fileId: fileAnchor, html: rawHtml });
  }

  return { fileContents, firstFileName, tempFilePaths };
}
