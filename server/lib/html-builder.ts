export { escapeHtml, escapeXML } from '../domain/xml';
export { detectChapters, generateTocHtml, isChapterHeading } from './html-builder/chapter-detector';
export type { DetectedChapter } from './html-builder/chapter-detector';
export { convertTextToHtml, convertTextToXhtml, renderContentToXhtml } from './html-builder/content-renderer';
export type { HtmlConversionOptions, RenderOptions } from './html-builder/content-renderer';
export { buildXhtmlDocument as buildHtmlDocument } from './html-builder/build-xhtml-document';
export { buildXhtmlChapter } from './html-builder/build-xhtml-chapter';
export { documentStyles } from './html-builder/styles';
