import fs from "fs/promises";
import {
  cleanupTempFile,
  mergeParagraphsFromFile,
  type TextCleanupOptions,
} from "../../lib/pdf-parser";
import { cleanupTextFile } from "../../lib/pdf-parser";
import { extractPDFText } from "../../lib/pdf-extractor/extractor";
import { enhanceContentFile } from "../../lib/content-enhancer/enhance-content-file";
import { detectTables } from "../../lib/table-detector/detector";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import {
  type BaseConversionSettings,
  type TextPrepOptions,
  type PreparedText,
  type PreparedContent,
  settingsToTextPrepOptions,
} from "./types";

const log = logger.child({ service: "pipeline-prep" });

export { settingsToTextPrepOptions };

let pipelineCounter = 0;
function generatePipelineId(): string {
  return `prep-${Date.now()}-${++pipelineCounter}`;
}

function logTiming(pipelineId: string, name: string, startTime: number): void {
  const durationMs = Date.now() - startTime;
  log.info(`${name} completed`, { pipelineId, durationMs });
}

export async function preparePdfText(
  pdfPath: string,
  options: TextPrepOptions
): Promise<{ prepared: PreparedText; tempFiles: string[] }> {
  const pipelineId = generatePipelineId();
  const pipelineStart = Date.now();
  const tempFiles: string[] = [];
  
  log.info("Starting PDF text preparation", {
    pipelineId,
    cleanup: {
      fixHyphenation: options.fixHyphenation,
      removeHeadersFooters: options.removeHeadersFooters,
      removePageNumbers: options.removePageNumbers,
      cleanWhitespace: options.cleanWhitespace,
      fixLigatures: options.fixLigatures,
    },
    processing: {
      detectChapters: options.detectChapters,
      mergeParagraphs: options.mergeParagraphs,
      detectTables: options.detectTables,
      sensitivity: options.sensitivity,
    },
    enhancement: {
      detectCodeBlocks: options.detectCodeBlocks,
      convertFootnotes: options.convertFootnotes,
      preserveTOCIndentation: options.preserveTOCIndentation,
      preserveIndex: options.preserveIndex,
    },
  });

  const extractStart = Date.now();
  const handle = extractPDFText(pdfPath, options.detectChapters, () => {});
  const result = await handle.promise;
  logTiming(pipelineId, "PDF text extraction", extractStart);

  if (!result.success || !result.tempTextFile) {
    throw new ConversionError("Failed to extract text from PDF");
  }

  let currentTempFile = result.tempTextFile;
  tempFiles.push(currentTempFile);

  const cleanupOptions: TextCleanupOptions = {
    fixHyphenation: options.fixHyphenation,
    removeHeadersFooters: options.removeHeadersFooters,
    removePageNumbers: options.removePageNumbers,
    cleanWhitespace: options.cleanWhitespace,
    mergeParagraphs: false,
    fixLigatures: options.fixLigatures,
    sensitivity: options.sensitivity,
  };

  const cleanupStart = Date.now();
  currentTempFile = await cleanupTextFile(currentTempFile, cleanupOptions);
  logTiming(pipelineId, "Text cleanup", cleanupStart);
  if (!tempFiles.includes(currentTempFile)) {
    tempFiles.push(currentTempFile);
  }

  let protectedLines: Set<number> | undefined;

  if (options.detectTables && options.mergeParagraphs) {
    const tableStart = Date.now();
    const tableResult = await detectTables(currentTempFile);
    logTiming(pipelineId, "Table detection for merge protection", tableStart);
    if (tableResult.tableLineNumbers.size > 0) {
      protectedLines = tableResult.tableLineNumbers;
      log.info("Protected lines from tables", { pipelineId, count: tableResult.tableLineNumbers.size });
    }
  }

  if (options.mergeParagraphs) {
    const mergeStart = Date.now();
    const mergedFile = await mergeParagraphsFromFile(
      currentTempFile,
      options.sensitivity,
      protectedLines
    );
    logTiming(pipelineId, "Paragraph merge", mergeStart);
    currentTempFile = mergedFile;
    if (!tempFiles.includes(currentTempFile)) {
      tempFiles.push(currentTempFile);
    }
  }

  const preEnhancementFile = currentTempFile;

  const needsEnhancement =
    options.detectCodeBlocks ||
    options.convertFootnotes ||
    options.preserveTOCIndentation ||
    options.preserveIndex;

  if (needsEnhancement) {
    const enhanceStart = Date.now();
    const enhanced = await enhanceContentFile(currentTempFile, {
      preserveTOCIndentation: options.preserveTOCIndentation,
      convertFootnotes: options.convertFootnotes,
      detectCode: options.detectCodeBlocks,
      preserveIndex: options.preserveIndex,
    });
    logTiming(pipelineId, "Content enhancement", enhanceStart);
    const enhancedTempFile = currentTempFile.replace(/\.txt$/, '-enhanced.txt');
    await fs.writeFile(enhancedTempFile, enhanced.content, 'utf8');
    currentTempFile = enhancedTempFile;
    if (!tempFiles.includes(currentTempFile)) {
      tempFiles.push(currentTempFile);
    }
  }

  const totalDuration = Date.now() - pipelineStart;
  log.info("PDF text preparation complete", { pipelineId, totalDurationMs: totalDuration, tempFileCount: tempFiles.length });

  return {
    prepared: {
      tempTextFile: currentTempFile,
      preEnhancementFile,
      chapters: result.chapters,
    },
    tempFiles,
  };
}

export async function cleanupTempFiles(tempFiles: string[]): Promise<void> {
  for (const tempFile of tempFiles) {
    await cleanupTempFile(tempFile).catch(() => {});
  }
}

export async function preparePdfForHtml(
  pdfPath: string,
  settings: BaseConversionSettings,
  detectChaptersEnabled: boolean = true
): Promise<PreparedContent> {
  const htmlPrepStart = Date.now();
  log.info("Starting HTML preparation", { detectChaptersEnabled });

  const options = settingsToTextPrepOptions(settings, detectChaptersEnabled);
  const { prepared, tempFiles } = await preparePdfText(pdfPath, options);

  const text = await fs.readFile(prepared.preEnhancementFile, "utf8");

  let tables: PreparedContent["tables"] = [];
  if (options.detectTables) {
    const tableStart = Date.now();
    tables = (await detectTables(prepared.preEnhancementFile)).tables;
    log.info("Final table detection completed", { durationMs: Date.now() - tableStart, count: tables.length });
  }

  const totalDuration = Date.now() - htmlPrepStart;
  log.info("HTML preparation complete", { totalDurationMs: totalDuration, textLength: text.length, tableCount: tables.length });

  return {
    text,
    tables,
    chapters: prepared.chapters,
    tempFiles,
  };
}
