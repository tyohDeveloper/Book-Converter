import { escapeXML } from "../html-builder";
import { generateUUID } from "./generate-uuid";

export interface TocNcxOptions {
  title: string;
  chapters: { id: string; href: string; title: string }[];
}

export function buildTocNcx(options: TocNcxOptions): string {
  const { title, chapters } = options;

  const navPoints = chapters.map((ch, i) => `
    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel>
        <text>${escapeXML(ch.title)}</text>
      </navLabel>
      <content src="${ch.href}"/>
    </navPoint>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${generateUUID()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXML(title)}</text>
  </docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
}
