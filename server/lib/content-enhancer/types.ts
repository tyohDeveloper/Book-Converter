export interface ContentEnhancements {
  tableOfContents: TOCEntry[];
  footnotes: Footnote[];
  codeBlocks: CodeBlock[];
  indexEntries: IndexEntry[];
}

export interface TOCEntry {
  title: string;
  level: number;
  pageRef?: string;
  lineNumber: number;
}

export interface Footnote {
  id: number;
  marker: string;
  text: string;
  lineNumber: number;
}

export interface CodeBlock {
  startLine: number;
  endLine: number;
  language?: string;
}

export interface IndexEntry {
  term: string;
  pageRefs: string[];
  subEntries?: IndexEntry[];
  lineNumber: number;
}

export interface EnhancedLine {
  text: string;
  type: 'normal' | 'toc-entry' | 'footnote-marker' | 'footnote-text' | 'code' | 'index-entry' | 'heading';
  indent: number;
  tocLevel?: number;
  footnoteId?: number;
  isCodeStart?: boolean;
  isCodeEnd?: boolean;
}

export interface EnhanceOptions {
  preserveTOCIndentation?: boolean;
  convertFootnotes?: boolean;
  detectCode?: boolean;
  preserveIndex?: boolean;
}

export interface EnhanceResult {
  content: string;
  enhancements: ContentEnhancements;
}
