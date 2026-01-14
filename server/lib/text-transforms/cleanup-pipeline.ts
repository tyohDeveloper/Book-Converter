import fs from "fs";
import { TextCleanupOptions } from "./types";
import { fixLigaturesFromFile } from "./ligatures";
import { fixHyphenationFromFile } from "./hyphenation";
import { removeHeadersFootersFromFile } from "./headers-footers";
import { removePageNumbersFromFile } from "./page-numbers";
import { cleanWhitespaceFromFile } from "./whitespace";
import { mergeParagraphsFromFile } from "./paragraph-merge";

export async function cleanupTextFile(
  inputFile: string,
  options: TextCleanupOptions
): Promise<string> {
  const needsCleanup =
    options.fixHyphenation ||
    options.removeHeadersFooters ||
    options.removePageNumbers ||
    options.cleanWhitespace ||
    options.mergeParagraphs ||
    options.fixLigatures;

  if (!needsCleanup) {
    return inputFile;
  }

  let currentFile = inputFile;
  let ownsCurrentFile = false;

  try {
    if (options.fixLigatures) {
      const newFile = await fixLigaturesFromFile(currentFile);
      currentFile = newFile;
      ownsCurrentFile = true;
    }

    if (options.fixHyphenation) {
      const newFile = await fixHyphenationFromFile(currentFile);
      currentFile = newFile;
      ownsCurrentFile = true;
    }

    if (options.removeHeadersFooters) {
      const newFile = await removeHeadersFootersFromFile(currentFile);
      currentFile = newFile;
      ownsCurrentFile = true;
    }

    if (options.removePageNumbers) {
      const newFile = await removePageNumbersFromFile(currentFile);
      currentFile = newFile;
      ownsCurrentFile = true;
    }

    if (options.cleanWhitespace) {
      const newFile = await cleanWhitespaceFromFile(currentFile);
      currentFile = newFile;
      ownsCurrentFile = true;
    }

    if (options.mergeParagraphs) {
      const newFile = await mergeParagraphsFromFile(
        currentFile,
        options.sensitivity || 50,
        options.protectedLines
      );
      currentFile = newFile;
      ownsCurrentFile = true;
    }

    return currentFile;
  } catch (error) {
    if (ownsCurrentFile && currentFile !== inputFile) {
      try {
        fs.unlinkSync(currentFile);
      } catch (e) {}
    }
    throw error;
  }
}

