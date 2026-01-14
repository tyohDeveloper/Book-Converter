import type { DetectedTable } from "../../lib/table-detector/types";
import type { ExtractedChapter } from "../../lib/pdf-extractor/types";

export interface ProcessedPage {
  pageNumber: number;
  text: string;
  tables: DetectedTable[];
  styledHtml?: string;
}

export interface BaseConversionSettings {
  mergeParagraphs?: boolean;
  removePageNumbers?: boolean;
  fixHyphenation?: boolean;
  removeHeadersFooters?: boolean;
  cleanWhitespace?: boolean;
  fixLigatures?: boolean;
  sensitivity?: number;
  detectCodeBlocks?: boolean;
  convertFootnotes?: boolean;
  preserveTOCIndentation?: boolean;
  preserveIndex?: boolean;
  detectTables?: boolean;
  includeTableOfContents?: boolean;
  title?: string;
  preserveStyles?: boolean;
}

export interface TextPrepOptions {
  mergeParagraphs: boolean;
  detectChapters: boolean;
  removePageNumbers: boolean;
  fixHyphenation: boolean;
  removeHeadersFooters: boolean;
  cleanWhitespace: boolean;
  fixLigatures: boolean;
  sensitivity: number;
  detectCodeBlocks: boolean;
  convertFootnotes: boolean;
  preserveTOCIndentation: boolean;
  preserveIndex: boolean;
  detectTables: boolean;
}

export interface PreparedText {
  tempTextFile: string;
  preEnhancementFile: string;
  chapters: ExtractedChapter[];
}

export interface TextPrepResult {
  prepared: PreparedText[];
  tempFiles: string[];
}

export interface PreparedContent {
  text: string;
  tables: DetectedTable[];
  chapters: ExtractedChapter[];
  tempFiles: string[];
}

export interface PageAwarePreparedContent {
  pages: ProcessedPage[];
  chapters: ExtractedChapter[];
  tempFiles: string[];
}

export function settingsToTextPrepOptions(
  settings: BaseConversionSettings,
  detectChapters: boolean = true
): TextPrepOptions {
  return {
    mergeParagraphs: settings.mergeParagraphs ?? true,
    detectChapters,
    removePageNumbers: settings.removePageNumbers ?? true,
    fixHyphenation: settings.fixHyphenation ?? true,
    removeHeadersFooters: settings.removeHeadersFooters ?? true,
    cleanWhitespace: settings.cleanWhitespace ?? true,
    fixLigatures: settings.fixLigatures ?? true,
    sensitivity: settings.sensitivity ?? 50,
    detectCodeBlocks: settings.detectCodeBlocks ?? true,
    convertFootnotes: settings.convertFootnotes ?? true,
    preserveTOCIndentation: settings.preserveTOCIndentation ?? true,
    preserveIndex: settings.preserveIndex ?? true,
    detectTables: settings.detectTables ?? true,
  };
}
