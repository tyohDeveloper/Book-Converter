import type { CodeBlock } from './types';

const codeIndicators = [
  /^\s*\(define\s/,
  /^\s*\(lambda\s/,
  /^\s*\(cond\s/,
  /^\s*\(if\s/,
  /^\s*\(let\s/,
  /^\s*def\s+\w+\s*\(/,
  /^\s*function\s+\w+\s*\(/,
  /^\s*class\s+\w+/,
  /^\s*import\s+/,
  /^\s*#include\s*</,
  /^\s*\{/,
  /^\s*\}/,
];

export function detectCodeBlocks(lines: string[]): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  let currentBlock: CodeBlock | null = null;
  let consecutiveIndented = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const trimmed = line.trim();
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;

    const isCodeLine = leadingSpaces >= 2 && trimmed.length > 0 && (
      codeIndicators.some(p => p.test(line)) ||
      /^[\(\)\[\]\{\}]/.test(trimmed) ||
      (leadingSpaces >= 4 && /[\(\)\[\]\{\}]/.test(trimmed))
    );

    if (isCodeLine || (leadingSpaces >= 4 && trimmed.length > 0)) {
      consecutiveIndented++;
      if (consecutiveIndented >= 2 && !currentBlock) {
        currentBlock = { startLine: lineNumber - 1, endLine: lineNumber };
      } else if (currentBlock) {
        currentBlock.endLine = lineNumber;
      }
    } else {
      if (currentBlock && consecutiveIndented >= 3) {
        codeBlocks.push(currentBlock);
      }
      currentBlock = null;
      consecutiveIndented = 0;
    }
  }

  if (currentBlock && consecutiveIndented >= 3) {
    codeBlocks.push(currentBlock);
  }

  return codeBlocks;
}
