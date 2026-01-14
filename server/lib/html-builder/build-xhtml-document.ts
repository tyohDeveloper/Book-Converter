import { escapeXML } from '../../domain/xml';
import { getDocumentStyles } from './styles';
import type { TypographySettings } from '@shared/contracts/settings';
import type { BookStylePreset } from '@shared/contracts/book-style-preset';

export interface XhtmlDocumentOptions {
  title: string;
  content: string;
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
  skipCss?: boolean;
  fontCss?: string;
}

export function buildXhtmlDocument(options: XhtmlDocumentOptions): string;
export function buildXhtmlDocument(title: string, content: string): string;
export function buildXhtmlDocument(titleOrOptions: string | XhtmlDocumentOptions, content?: string): string {
  let title: string;
  let htmlContent: string;
  let typography: Partial<TypographySettings> | undefined;
  let bookStylePreset: BookStylePreset | undefined;
  let skipCss = false;
  let fontCss = '';

  if (typeof titleOrOptions === 'string') {
    title = titleOrOptions;
    htmlContent = content || '';
  } else {
    title = titleOrOptions.title;
    htmlContent = titleOrOptions.content;
    typography = titleOrOptions.typography;
    bookStylePreset = titleOrOptions.bookStylePreset;
    skipCss = titleOrOptions.skipCss || false;
    fontCss = titleOrOptions.fontCss || '';
  }

  const escapedTitle = escapeXML(title);
  const styleOptions = bookStylePreset ? { typography, bookStylePreset } : typography;
  const cssContent = fontCss ? `${fontCss}\n\n${getDocumentStyles(styleOptions)}` : getDocumentStyles(styleOptions);
  const styleSection = skipCss ? '' : `<style type="text/css">${cssContent}
    </style>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
    <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8"/>
    <title>${escapedTitle}</title>
    ${styleSection}
</head>
<body>
    ${htmlContent}
</body>
</html>`;
}
