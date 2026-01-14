import type { ManagedFile } from "../../lib/file-manager/types";
import type { TypographySettings } from "@shared/contracts/settings";

export interface ChapterData {
  title: string;
  id: string;
  content: string;
}

export interface EpubConversionSettings {
  title?: string;
  author?: string;
  compressionLevel?: "fast" | "maximum";
  typography?: Partial<TypographySettings>;
}

export interface EpubToHtmlSettings {
  title?: string;
  includeTableOfContents?: boolean;
  skipCss?: boolean;
}

export interface SplitEpubSettings {
  excludeToc?: boolean;
  outputFormat?: "zip" | "individual";
}

export interface EpubConversionResult {
  file: ManagedFile;
}

export interface SplitEpubResult {
  file?: ManagedFile;
  files?: ManagedFile[];
  chapterCount: number;
}
