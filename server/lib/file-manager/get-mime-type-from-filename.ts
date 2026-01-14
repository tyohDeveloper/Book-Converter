import { MIME_TYPES } from './types';

export function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  if (ext === '.pdf') return MIME_TYPES.pdf;
  if (ext === '.docx') return MIME_TYPES.docx;
  if (ext === '.epub') return MIME_TYPES.epub;
  if (ext === '.html' || ext === '.htm') return MIME_TYPES.html;
  if (ext === '.xhtml') return MIME_TYPES.xhtml;
  if (ext === '.zip') return MIME_TYPES.zip;
  if (ext === '.css') return MIME_TYPES.css;
  return 'application/octet-stream';
}
