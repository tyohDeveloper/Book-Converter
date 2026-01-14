import { tableToHTML } from '../table-detector/renderer';
import type { DetectedTable } from '../table-detector/types';
import { escapeHtml } from '../../domain/xml';
import { detectChapters, generateTocHtml, type DetectedChapter } from './chapter-detector';
import { buildTableLineMap } from './build-table-line-map';
import { createBlockState, handleBlockLine, tryStartBlock } from './handle-block-content';

export interface HtmlConversionOptions {
  includeToc?: boolean;
  tables?: DetectedTable[];
  chapters?: DetectedChapter[];
  wrapChapters?: boolean;
}

export function convertTextToHtml(
  text: string,
  tables: DetectedTable[],
  options: HtmlConversionOptions = {}
): string {
  const { includeToc = false, chapters: preDetectedChapters, wrapChapters = true } = options;
  const lines = text.split('\n');
  const htmlParts: string[] = [];

  const chapters = preDetectedChapters ?? detectChapters(text);
  const chapterLineMap = new Map<number, DetectedChapter>();
  if (wrapChapters) {
    for (const ch of chapters) {
      chapterLineMap.set(ch.lineNumber, ch);
    }
  }

  if (includeToc && chapters.length > 0) {
    htmlParts.push(generateTocHtml(chapters));
  }

  const { tableStartLines, tableLines } = buildTableLineMap(tables);
  const blockState = createBlockState();
  let inSection = false;

  let i = 0;
  while (i < lines.length) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (blockState.inBlock) {
      const result = handleBlockLine(blockState, line);
      if (result !== null) {
        htmlParts.push(result);
      }
      i++;
      continue;
    }

    const table = tableStartLines.get(lineNum);
    if (table) {
      htmlParts.push(tableToHTML(table));
      while (i < lines.length && tableLines.has(i + 1)) {
        i++;
      }
      continue;
    }

    if (tableLines.has(lineNum)) {
      i++;
      continue;
    }

    if (trimmed.length === 0) {
      i++;
      continue;
    }

    const chapter = chapterLineMap.get(lineNum);
    if (chapter) {
      if (inSection) {
        htmlParts.push('</section>');
      }
      htmlParts.push(`<section class="chapter" id="${chapter.id}">`);
      htmlParts.push(`<h2 class="chapter-heading">${escapeHtml(trimmed)}</h2>`);
      inSection = true;
      i++;
      continue;
    }

    const blockResult = tryStartBlock(blockState, line, trimmed);
    if (blockResult !== null) {
      if (blockResult.output !== null) {
        htmlParts.push(blockResult.output);
      }
      i++;
      continue;
    }

    htmlParts.push(`<p>${escapeHtml(trimmed)}</p>`);
    i++;
  }

  if (blockState.inBlock && blockState.blockLines.length > 0) {
    htmlParts.push(blockState.blockLines.join('\n'));
  }

  if (inSection) {
    htmlParts.push('</section>');
  }

  return htmlParts.join('\n');
}

export function convertTextToXhtml(
  text: string,
  tables: DetectedTable[],
  options: HtmlConversionOptions = {}
): string {
  const htmlContent = convertTextToHtml(text, tables, options);
  return htmlContent
    .replace(/<br>/g, '<br/>')
    .replace(/<hr>/g, '<hr/>');
}

export interface RenderOptions {
  tables?: DetectedTable[];
  includeToc?: boolean;
  chapters?: DetectedChapter[];
  wrapChapters?: boolean;
}

export function renderContentToXhtml(
  content: string,
  options: RenderOptions = {}
): string {
  const { tables = [], includeToc = false, chapters, wrapChapters } = options;
  return convertTextToXhtml(content, tables, { includeToc, chapters, wrapChapters });
}
