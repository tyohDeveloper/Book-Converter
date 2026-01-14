import type { ManagedFile } from "../../lib/file-manager/types";
import { loadHtmlDocument, saveFormattedOutput } from "./html-pipeline";
import { removeNullSpans } from "./remove-null-spans";
import { stripWhitespaceStyles } from "./strip-whitespace-styles";
import { removeInterparagraphBr } from "./remove-interparagraph-br";
import { flattenNestedElements } from "./flatten-nested-elements";
import { removeUndefinedClasses } from "./remove-undefined-classes";
import { logger } from "../../common/logger";

const log = logger.child({ service: "clean-html" });

export interface CleanHtmlSettings {
  removeNullSpans?: boolean;
  removeWhitespaceStyles?: boolean;
  removeInterparagraphBr?: boolean;
  flattenNestedElements?: boolean;
  removeUndefinedClasses?: boolean;
}

export interface CleanHtmlStats {
  nullSpansRemoved: number;
  whitespaceStylesRemoved: number;
  brElementsRemoved: number;
  nestedElementsFlattened: number;
  undefinedClassesRemoved: number;
}


export interface CleanHtmlResult {
  file: ManagedFile;
  stats: CleanHtmlStats;
}

export async function cleanHtml(
  sessionId: string,
  fileId: string,
  settings: CleanHtmlSettings = {}
): Promise<CleanHtmlResult> {
  const { dom, doc, body, file, isAlreadyFormatted } = await loadHtmlDocument(sessionId, fileId);
  
  const stats: CleanHtmlStats = {
    nullSpansRemoved: 0,
    whitespaceStylesRemoved: 0,
    brElementsRemoved: 0,
    nestedElementsFlattened: 0,
    undefinedClassesRemoved: 0,
  };

  if (settings.removeNullSpans !== false) {
    stats.nullSpansRemoved = removeNullSpans(body);
  }

  if (settings.removeWhitespaceStyles !== false) {
    stats.whitespaceStylesRemoved = stripWhitespaceStyles(body);
  }

  if (settings.removeInterparagraphBr !== false) {
    stats.brElementsRemoved = removeInterparagraphBr(body);
  }

  if (settings.flattenNestedElements !== false) {
    stats.nestedElementsFlattened = flattenNestedElements(body);
  }

  if (settings.removeUndefinedClasses !== false) {
    stats.undefinedClassesRemoved = removeUndefinedClasses(body);
  }

  log.info("HTML cleanup complete", { stats });

  const outputFile = await saveFormattedOutput({
    sessionId,
    fileId,
    dom,
    originalName: file.originalName,
    isAlreadyFormatted,
    prefix: "html-clean",
  });

  return { file: outputFile, stats };
}
