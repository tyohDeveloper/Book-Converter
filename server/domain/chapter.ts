// Comprehensive chapter detection patterns
// Used by: html-builder, pdf-text-extractor, pdf-parser

// HTML/EPUB chapter patterns - more flexible, allows subtitles or standalone
export const CHAPTER_PATTERNS_FLEXIBLE = [
  /^Chapter\s+(\d+|[IVXLC]+)\s*$/i,                        // "Chapter 1" or "Chapter I"
  /^Chapter\s+(\d+|[IVXLC]+)\s*[:.]\s*(.+)?$/i,            // "Chapter 1: Title" or "Chapter 1:"
  /^Chapter\s+(\d+|[IVXLC]+)\s+(.+)$/i,                    // "Chapter 1 Title"
  /^Part\s+(\d+|[IVXLC]+)\s*$/i,                           // "Part 1" or "Part I"
  /^Part\s+(\d+|[IVXLC]+)\s*[:.]\s*(.+)?$/i,               // "Part 1: Title"
  /^Part\s+(\d+|[IVXLC]+)\s+(.+)$/i,                       // "Part 1 Title"
  /^Section\s+(\d+|[IVXLC]+)(?:\s*[:.]\s*|\s+)?(.+)?$/i,   // "Section 1" with optional title
  /^Book\s+(\d+|[IVXLC]+)(?:\s*[:.]\s*|\s+)?(.+)?$/i,      // "Book 1" with optional title
  /^Prologue$/i,
  /^Epilogue$/i,
  /^Introduction$/i,
  /^Preface$/i,
  /^Foreword$/i,
  /^Afterword$/i,
  /^Appendix(?:\s+[A-Z])?(?:\s*[:.]\s*|\s+)?(.+)?$/i,
  /^Conclusion$/i,
];

// PDF extraction patterns - stricter, for actual heading detection
export const CHAPTER_PATTERNS_STRICT = [
  /^Chapter\s+(\d+|[IVXLCDM]+)\s*$/i,
  /^Chapter\s+(\d+|[IVXLCDM]+)[:.]\s*([A-Z][^a-z]*|[A-Z][A-Za-z\s]{0,50})$/,
  /^CHAPTER\s+(\d+|[IVXLCDM]+)(\s+[A-Z][A-Z\s]*)?$/,
  /^Part\s+(\d+|[IVXLCDM]+)\s*$/i,
  /^Part\s+(\d+|[IVXLCDM]+)[:.]\s*([A-Z].{0,50})$/i,
  /^PART\s+(\d+|[IVXLCDM]+)(\s+[A-Z][A-Z\s]*)?$/,
  /^Section\s+(\d+|[IVXLCDM]+)\s*$/i,
  /^Section\s+(\d+|[IVXLCDM]+)[:.]\s*.{0,50}$/i,
  /^Book\s+(\d+|[IVXLCDM]+)\s*$/i,
  /^Book\s+(\d+|[IVXLCDM]+)[:.]\s*.{0,50}$/i,
  /^(\d+(?:\.\d+)*)\s+[A-Z][A-Za-z\s]{0,60}$/,
];

// Standalone patterns for documents (pdf-parser)
export const CHAPTER_PATTERNS_STANDALONE = [
  /^chapter\s+\d+/i,
  /^chapter\s+[ivxlcdm]+/i,
  /^part\s+\d+/i,
  /^part\s+[ivxlcdm]+/i,
  /^book\s+\d+/i,
  /^book\s+[ivxlcdm]+/i,
  /^section\s+\d+/i,
  /^prologue$/i,
  /^epilogue$/i,
  /^introduction$/i,
  /^preface$/i,
  /^foreword$/i,
  /^afterword$/i,
  /^appendix\s*[a-z]?$/i,
  /^conclusion$/i,
];

export function isChapterHeading(line: string, patterns: RegExp[] = CHAPTER_PATTERNS_FLEXIBLE): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 100) return false;
  return patterns.some(pattern => pattern.test(trimmed));
}

export interface ChapterInfo {
  title: string;
  page: number;
  id?: string;
  tempFile?: string;
}

export function generateChapterId(index: number): string {
  return `chapter-${index + 1}`;
}
