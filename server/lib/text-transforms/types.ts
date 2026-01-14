export interface TextCleanupOptions {
  fixHyphenation?: boolean;
  removeHeadersFooters?: boolean;
  removePageNumbers?: boolean;
  cleanWhitespace?: boolean;
  mergeParagraphs?: boolean;
  fixLigatures?: boolean;
  sensitivity?: number;
  protectedLines?: Set<number>;
}

export interface Chapter {
  title: string;
  page: number;
  content: string;
  tempFile?: string;
}

export interface ParsedPDF {
  text: string;
  chapters: Chapter[];
  totalPages: number;
  tempTextFile?: string;
}
