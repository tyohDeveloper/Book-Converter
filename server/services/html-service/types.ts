import type { ManagedFile } from "../../lib/file-manager/types";
import type { TypographySettings } from "@shared/contracts/settings";
import type { BookStylePreset } from "@shared/contracts/book-style-preset";
import type { BaseConversionSettings, ProcessedPage } from "../pipelines/text-prep";

export interface HtmlConversionSettings extends BaseConversionSettings {
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
  simpleExtraction?: boolean;
  skipCss?: boolean;
  preserveStyles?: boolean;
}

export interface HtmlConversionResult {
  files: ManagedFile[];
}

export interface InternalHtmlResult {
  htmlPath: string;
  tempFiles: string[];
}

export interface FileContent {
  name: string;
  fileId: string;
  pages: ProcessedPage[];
}
