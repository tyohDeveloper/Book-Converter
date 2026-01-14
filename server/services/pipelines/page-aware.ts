import { detectAndProtectTables } from "../../lib/table-detector/process-with-tables";
import { mergeParagraphs } from "../../lib/pdf-parser";
import { cleanupText } from "../../lib/text-transforms/in-memory";
import {
  type BaseConversionSettings,
  type TextPrepOptions,
  type ProcessedPage,
  type PageAwarePreparedContent,
  settingsToTextPrepOptions,
} from "./types";
import { extractStyledText } from "../pdf-styled-extractor/extractor";
import { styledLinesToHtml } from "../pdf-styled-extractor/lines-to-html";

/**
 * Prepare PDF for HTML conversion with page-aware processing.
 * Each page is processed separately to prevent cross-page paragraph merging.
 * 
 * This function uses the SAME extraction approach as the debugger:
 * 1. Spawn pdftotext and capture raw output
 * 2. Split by form-feed FIRST to get individual pages
 * 3. For each page: apply cleanup, detect tables, then merge paragraphs
 */
export async function preparePdfForHtmlPageAware(
  pdfPath: string,
  settings: BaseConversionSettings,
  detectChaptersEnabled: boolean = true
): Promise<PageAwarePreparedContent> {
  const tempFiles: string[] = [];
  const options = settingsToTextPrepOptions(settings, detectChaptersEnabled);
  const preserveStyles = settings.preserveStyles ?? false;
  
  console.log('[page-aware] preserveStyles:', preserveStyles);
  
  const styledPagesPromise = preserveStyles 
    ? extractStyledText(pdfPath).catch((err) => {
        console.error('[page-aware] styled extraction failed:', err);
        return null;
      })
    : Promise.resolve(null);

  const { spawn } = await import('child_process');
  
  const rawText = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const proc = spawn('pdftotext', ['-layout', pdfPath, '-']);
    
    proc.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    proc.stderr.on('data', (data: Buffer) => {
      console.warn('pdftotext stderr:', data.toString());
    });
    
    proc.on('error', (err) => {
      reject(new Error(`Failed to run pdftotext: ${err.message}`));
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pdftotext exited with code ${code}`));
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });

  const pageTexts = rawText.split('\f');
  const processedPages: ProcessedPage[] = [];

  for (let i = 0; i < pageTexts.length; i++) {
    let pageText = pageTexts[i].trim();
    
    if (!pageText) continue;

    pageText = cleanupPageText(pageText, options);

    const tableResult = options.detectTables
      ? detectAndProtectTables(
          pageText,
          options.mergeParagraphs ? mergeParagraphs : undefined,
          options.sensitivity
        )
      : { text: options.mergeParagraphs ? mergeParagraphs(pageText, options.sensitivity) : pageText, tables: [] };

    processedPages.push({
      pageNumber: i + 1,
      text: tableResult.text,
      tables: tableResult.tables,
    });
  }

  const styledResult = await styledPagesPromise;
  if (styledResult) {
    const styledPageMap = new Map<number, string>();
    for (const styledPage of styledResult.pages) {
      styledPageMap.set(styledPage.pageNumber, styledLinesToHtml(styledPage.lines));
    }
    for (const processedPage of processedPages) {
      const styledHtml = styledPageMap.get(processedPage.pageNumber);
      if (styledHtml) {
        processedPage.styledHtml = styledHtml;
      }
    }
  }

  return {
    pages: processedPages,
    chapters: [],
    tempFiles,
  };
}

/**
 * Apply in-memory text cleanup to a single page's text.
 */
function cleanupPageText(text: string, options: TextPrepOptions): string {
  return cleanupText(text, {
    fixLigatures: options.fixLigatures,
    fixHyphenation: options.fixHyphenation,
    cleanWhitespace: options.cleanWhitespace,
  });
}
