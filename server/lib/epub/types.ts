import type { Chapter } from "../text-transforms/types";
import type { ExtractedChapter } from "../pdf-extractor/types";
import type { ExtractedImage } from "../image-extractor";
import type { TypographySettings } from "@shared/contracts/settings";
import type { BookStylePreset } from "@shared/contracts/book-style-preset";

export interface EPUBOptions {
  title: string;
  author: string;
  chapters: Chapter[];
  fullText: string;
  tempTextFile?: string;
  compressionLevel?: "fast" | "maximum";
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
}

export interface EPUBOptionsWithChapterFiles {
  title: string;
  author: string;
  chapters: ExtractedChapter[];
  compressionLevel?: "fast" | "maximum";
  images?: ExtractedImage[];
  includeTableOfContents?: boolean;
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
}

export interface StreamingEPUBResult {
  filePath: string;
  size: number;
  chapterCount: number;
}

export interface HtmlToEpubOptions {
  htmlPath: string;
  title: string;
  author: string;
  compressionLevel?: "fast" | "maximum";
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
}

export interface HtmlChapter {
  title: string;
  content: string;
}
