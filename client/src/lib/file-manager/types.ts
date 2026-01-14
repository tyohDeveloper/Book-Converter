export interface ManagedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  isOutput?: boolean;
  outputType?: 'epub' | 'pdf' | 'compressed' | 'html';
  mimeType?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  currentFile?: string;
  currentIndex?: number;
  totalFiles?: number;
}

export interface OutputFileResult {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ProgressUpdate {
  stage: string;
  percent: number;
  message: string;
}

export interface StructureResult {
  fileId: string;
  fileName: string;
  structure?: {
    metadata: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
      creator?: string;
      producer?: string;
      creationDate?: string;
      modificationDate?: string;
    };
    pages: {
      count: number;
      dimensions: Array<{ width: number; height: number; rotation: number }>;
    };
    fonts: Array<{ name: string; type: string; embedded: boolean }>;
    images: { count: number };
    fileInfo: { sizeBytes: number; version?: string; encrypted: boolean; limitedAnalysis?: boolean };
  };
  error?: string;
}

export interface AnalyzeResult {
  fileId: string;
  fileName: string;
  totalPages?: number;
  chapters?: Array<{ title: string; page: number }>;
  preview?: string;
  error?: string;
}

export interface OptimizeResult {
  success: boolean;
  file: OutputFileResult;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
}

export interface ConvertResult {
  success: boolean;
  file?: OutputFileResult;
  files?: OutputFileResult[];
}

export interface CombineResult {
  success: boolean;
  file: OutputFileResult;
}

export interface EpubSettings {
  title?: string;
  author?: string;
  compressionLevel?: 'fast' | 'maximum';
  typography?: TypographySettings;
}

export interface BookStylePreset {
  id: string;
  name: string;
  bodyFontFamily: string;
  bodyFontSize: number;
  lineHeight: number;
  headingFontFamily: string;
  headingScale: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
  tocStyle: { titleSize: number; entrySize: number; showDivider: boolean };
  paragraphSpacing: number;
  firstLineIndent: number;
}

export interface ConvertSettings {
  mergeParagraphs?: boolean;
  detectChapters?: boolean;
  removePageNumbers?: boolean;
  fixHyphenation?: boolean;
  removeHeadersFooters?: boolean;
  cleanWhitespace?: boolean;
  sensitivity?: number;
  title?: string;
  author?: string;
  compressionLevel?: 'fast' | 'maximum';
  detectCodeBlocks?: boolean;
  convertFootnotes?: boolean;
  preserveTOCIndentation?: boolean;
  preserveIndex?: boolean;
  detectTables?: boolean;
  includeTableOfContents?: boolean;
  outputFormat?: 'bundled' | 'individual';
  typography?: TypographySettings;
  bookStylePreset?: BookStylePreset;
}

export interface TypographySettings {
  fontFamily?: 'serif' | 'sans-serif' | 'georgia' | 'times' | 'palatino' | 'arial' | 'helvetica' | 'verdana';
  fontSize?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'justify';
  paragraphSpacing?: number;
  firstLineIndent?: number;
  pageMargin?: number;
  headingSize?: number;
}

export interface DocxConversionSettings {
  title?: string;
  author?: string;
  includeTableOfContents?: boolean;
}

export interface DocxConvertResult {
  success: boolean;
  file: OutputFileResult;
}

export interface EpubToHtmlSettings {
  title?: string;
  includeTableOfContents?: boolean;
  skipCss?: boolean;
}

export interface EpubConvertResult {
  success: boolean;
  file: OutputFileResult;
}

export interface SplitEpubSettings {
  excludeToc?: boolean;
  outputFormat?: 'zip' | 'individual';
}

export interface SplitEpubResult {
  success: boolean;
  file?: OutputFileResult;
  files?: OutputFileResult[];
  chapterCount: number;
}

export interface SplitHtmlSettings {
  excludeToc?: boolean;
  outputFormat?: 'zip' | 'individual';
}

export interface SplitHtmlResult {
  success: boolean;
  file?: OutputFileResult;
  files?: OutputFileResult[];
  chapterCount: number;
}

export interface HtmlToDocxSettings {
  title?: string;
  author?: string;
  mode?: 'combine' | 'batch';
}

export interface HtmlToDocxResult {
  success: boolean;
  file?: OutputFileResult;
  files?: OutputFileResult[];
}

export interface BundleHtmlSettings {
  title?: string;
  includeTableOfContents?: boolean;
  skipCss?: boolean;
}

export interface BundleHtmlResult {
  success: boolean;
  file: OutputFileResult;
}

