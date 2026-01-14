import type { ManagedFile } from "../../lib/file-manager/types";

export interface DocxFileContent {
  name: string;
  fileId: string;
  html: string;
}

export interface DocxConversionSettings {
  title?: string;
  author?: string;
  includeTableOfContents?: boolean;
}

export interface DocxConversionResult {
  file: ManagedFile;
}

export interface HtmlToDocxSettings {
  title?: string;
  author?: string;
  mode?: 'combine' | 'batch';
  includeToc?: boolean;
}

export interface BatchDocxConversionResult {
  files: ManagedFile[];
}
