import { escapeXML } from "../html-builder";
import { generateUUID } from "./generate-uuid";

export interface ManifestItem {
  id: string;
  href: string;
  mediaType?: string;
}

export interface ContentOpfOptions {
  title: string;
  author: string;
  language?: string;
  chapters: ManifestItem[];
  images?: ManifestItem[];
  includeStylesheet?: boolean;
}

export function buildContentOpf(options: ContentOpfOptions): string {
  const { title, author, language = "en", chapters, images = [], includeStylesheet = true } = options;

  const chapterItems = chapters.map(ch => 
    `    <item id="${ch.id}" href="${ch.href}" media-type="${ch.mediaType || 'application/xhtml+xml'}"/>`
  ).join("\n");

  const imageItems = images.map(img =>
    `    <item id="${img.id}" href="${img.href}" media-type="${img.mediaType || 'image/jpeg'}"/>`
  ).join("\n");

  const spineItems = chapters.map(ch => 
    `    <itemref idref="${ch.id}"/>`
  ).join("\n");

  const styleItem = includeStylesheet
    ? `    <item id="stylesheet" href="stylesheet.css" media-type="text/css"/>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXML(title)}</dc:title>
    <dc:creator>${escapeXML(author)}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:identifier id="BookID">urn:uuid:${generateUUID()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${styleItem}${chapterItems}
${imageItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`;
}
