import type { ManagedFile as DbManagedFile } from '@shared/schema';

export interface ManagedFile {
  id: string;
  originalName: string;
  storageKey: string;
  size: number;
  uploadedAt: Date;
  mimeType: string;
  isOutput: boolean;
  outputType: string | null;
}

export interface FileSession {
  id: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

export const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const MIME_TYPES: Record<string, string> = {
  epub: 'application/epub+zip',
  pdf: 'application/pdf',
  compressed: 'application/pdf',
  html: 'text/html',
  xhtml: 'application/xhtml+xml',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
  css: 'text/css',
};

export const FILE_EXTENSIONS: Record<string, string> = {
  epub: '.epub',
  pdf: '.pdf',
  compressed: '.pdf',
  html: '.html',
  xhtml: '.xhtml',
  docx: '.docx',
  zip: '.zip',
  css: '.css',
};

export const SUPPORTED_SOURCE_EXTENSIONS = ['.pdf', '.docx', '.epub', '.html', '.htm', '.xhtml', '.css'];
export const SUPPORTED_SOURCE_MIMES = [MIME_TYPES.pdf, MIME_TYPES.docx, MIME_TYPES.epub, MIME_TYPES.html, MIME_TYPES.xhtml, MIME_TYPES.css];

export function toManagedFile(dbFile: DbManagedFile): ManagedFile {
  return {
    id: dbFile.id,
    originalName: dbFile.originalName,
    storageKey: dbFile.storageKey,
    size: dbFile.size,
    uploadedAt: dbFile.uploadedAt,
    mimeType: dbFile.mimeType,
    isOutput: dbFile.isOutput,
    outputType: dbFile.outputType,
  };
}
