import fs from 'fs/promises';
import { detectTableOfContents } from './toc-detector';
import { detectFootnotes } from './footnote-detector';
import { detectCodeBlocks } from './code-detector';
import { detectIndexSection } from './index-detector';
import type { ContentEnhancements, EnhanceOptions, EnhanceResult, Footnote } from './types';
import { ConversionError } from '../../common/errors/specific-errors';
import { logger } from '../../common/logger';

const log = logger.child({ module: 'content-enhancer' });

export async function enhanceContentFile(
  inputPath: string,
  options: EnhanceOptions = {}
): Promise<EnhanceResult> {
  let content: string;
  
  try {
    content = await fs.readFile(inputPath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to read input file', { inputPath, error: message });
    throw new ConversionError(`Failed to read file: ${message}`);
  }

  return enhanceContent(content, options);
}

export function enhanceContent(
  content: string,
  options: EnhanceOptions = {}
): EnhanceResult {
  const lines = content.split(/\r?\n/);

  const tocEntries = options.preserveTOCIndentation ? detectTableOfContents(lines) : [];
  const footnotes = options.convertFootnotes ? detectFootnotes(lines) : [];
  const codeBlocks = options.detectCode ? detectCodeBlocks(lines) : [];
  const indexEntries = options.preserveIndex ? detectIndexSection(lines) : [];

  const codeLineNumbers = buildCodeLineSet(codeBlocks);
  const footnoteMap = new Map(footnotes.map(f => [f.id.toString(), f]));

  const outputLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];

    if (codeLineNumbers.has(lineNumber)) {
      if (!inCodeBlock) {
        outputLines.push('```');
        inCodeBlock = true;
      }
      outputLines.push(line);
      continue;
    } else if (inCodeBlock) {
      outputLines.push('```');
      inCodeBlock = false;
    }

    let outputLine = line;
    if (options.convertFootnotes) {
      outputLine = outputLine.replace(/(\d+)\s*$/g, (match, num) => {
        if (footnoteMap.has(num)) return `[^${num}]`;
        return match;
      });
    }

    outputLines.push(outputLine);
  }

  if (inCodeBlock) {
    outputLines.push('```');
  }

  if (options.convertFootnotes && footnotes.length > 0) {
    outputLines.push('', '', '---', '## Notes', '');
    for (const footnote of footnotes) {
      outputLines.push(`[^${footnote.id}]: ${footnote.text}`, '');
    }
  }

  return {
    content: outputLines.join('\n'),
    enhancements: { tableOfContents: tocEntries, footnotes, codeBlocks, indexEntries }
  };
}

function buildCodeLineSet(codeBlocks: { startLine: number; endLine: number }[]): Set<number> {
  const set = new Set<number>();
  for (const block of codeBlocks) {
    for (let i = block.startLine; i <= block.endLine; i++) {
      set.add(i);
    }
  }
  return set;
}
