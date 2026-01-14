import { PdfReader } from "pdfreader";
import fs from "fs";
import { getTempFilePath } from "../domain/paths";
import { CHAPTER_PATTERNS_STANDALONE, isChapterHeading } from "../domain/chapter";

export type { Chapter, ParsedPDF, TextCleanupOptions } from "./text-transforms/types";
export { cleanupTextFile } from "./text-transforms/cleanup-pipeline";
export { cleanupTempFile } from "./temp-cleanup/helpers";
export { mergeParagraphsFromFile, mergeParagraphs } from "./text-transforms/paragraph-merge";
export { removePageNumbersFromFile, removePageNumbers } from "./text-transforms/page-numbers";
export { fixHyphenationFromFile } from "./text-transforms/hyphenation";
export { removeHeadersFootersFromFile } from "./text-transforms/headers-footers";
export { cleanWhitespaceFromFile } from "./text-transforms/whitespace";
export { fixLigatures, fixLigaturesFromFile } from "./text-transforms/ligatures";

import type { Chapter, ParsedPDF } from "./text-transforms/types";

export async function parsePDFFromFile(
  filePath: string,
  detectChapters: boolean
): Promise<ParsedPDF> {
  return new Promise((resolve, reject) => {
    let currentPage = 1;
    let maxPage = 1;
    let lastY: number | null = null;
    let currentLine = "";
    let totalChars = 0;

    const tempTextFile = getTempFilePath("pdf-text");
    const writeStream = fs.createWriteStream(tempTextFile, { encoding: "utf8" });

    const MAX_SAMPLE_SIZE = 100000;
    let textSample = "";
    const chapters: Chapter[] = [];

    const reader = new PdfReader();

    const writeLine = (line: string) => {
      if (line) {
        writeStream.write(line + "\n");
        totalChars += line.length + 1;

        if (textSample.length < MAX_SAMPLE_SIZE) {
          textSample += line + "\n";
        }

        if (detectChapters) {
          const trimmedLine = line.trim();
          if (
            trimmedLine.length > 0 &&
            trimmedLine.length < 100 &&
            isChapterHeading(trimmedLine, CHAPTER_PATTERNS_STANDALONE)
          ) {
            chapters.push({
              title: trimmedLine,
              page: currentPage,
              content: "",
            });
          }
        }
      }
    };

    reader.parseFileItems(filePath, (err: any, item: any) => {
      if (err) {
        writeStream.end();
        try {
          fs.unlinkSync(tempTextFile);
        } catch (e) {}
        return reject(err);
      }

      if (!item) {
        if (currentLine.trim()) {
          writeLine(currentLine.trim());
        }

        writeStream.end(() => {
          if (chapters.length === 0) {
            chapters.push({
              title: "Content",
              page: 1,
              content: "",
            });
          }

          resolve({
            text: textSample,
            chapters,
            totalPages: maxPage,
            tempTextFile,
          });
        });
        return;
      }

      if (item.page) {
        if (currentLine.trim()) {
          writeLine(currentLine.trim());
          currentLine = "";
        }

        currentPage = item.page;
        maxPage = Math.max(maxPage, currentPage);
        lastY = null;
        writeLine("");
      }

      if (item.text) {
        if (lastY !== null && item.y !== undefined && Math.abs(item.y - lastY) > 0.5) {
          if (currentLine.trim()) {
            writeLine(currentLine.trim());
            currentLine = "";
          }
        }

        currentLine += (currentLine ? " " : "") + item.text;
        lastY = item.y;
      }
    });
  });
}
