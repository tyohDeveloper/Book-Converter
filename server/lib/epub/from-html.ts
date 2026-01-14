import archiver from "archiver";
import fs from "fs";
import type { HtmlToEpubOptions } from "./types";
import { getContainerXML } from "./get-container-xml";
import { generateUUID } from "./generate-uuid";
import { getStylesheet } from "./stylesheet";
import { extractChaptersWithCss } from "./html-parser";
import { escapeXML } from "../html-builder";
import { logger } from "../../common/logger";

const log = logger.child({ module: "epub-from-html" });

function buildContentOpf(title: string, author: string, chapters: { title: string }[]): string {
  const manifestItems = chapters
    .map((_, i) => `    <item id="chapter${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join("\n");

  const spineItems = chapters
    .map((_, i) => `    <itemref idref="chapter${i + 1}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXML(title)}</dc:title>
    <dc:creator>${escapeXML(author)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookID">urn:uuid:${generateUUID()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="stylesheet" href="stylesheet.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`;
}

function buildTocNcx(title: string, chapters: { title: string }[]): string {
  const navPoints = chapters
    .map((chapter, index) => `
    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${escapeXML(chapter.title)}</text>
      </navLabel>
      <content src="chapter${index + 1}.xhtml"/>
    </navPoint>`)
    .join("");

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

function buildChapterXhtml(chapter: { title: string; content: string }): string {
  const xhtmlContent = chapter.content
    .replace(/<br>/g, "<br/>")
    .replace(/<hr>/g, "<hr/>")
    .replace(/<hr class="([^"]+)">/g, '<hr class="$1"/>');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXML(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <h1>${escapeXML(chapter.title)}</h1>
${xhtmlContent}
</body>
</html>`;
}

export async function generateEPUBFromHtml(options: HtmlToEpubOptions): Promise<Buffer> {
  const { htmlPath, title, author, compressionLevel = "maximum", typography, bookStylePreset } = options;

  log.info("generating EPUB from HTML", { path: htmlPath });

  const htmlContent = await fs.promises.readFile(htmlPath, "utf8");
  const { chapters, sharedCss } = extractChaptersWithCss(htmlContent);
  log.debug("extracted chapters from HTML", { count: chapters.length, hasCss: !!sharedCss });

  const stylesheetOptions = bookStylePreset ? { typography, bookStylePreset } : typography;
  const baseStylesheet = getStylesheet(stylesheetOptions);
  const fullStylesheet = sharedCss 
    ? `${baseStylesheet}\n\n/* Source file styles */\n${sharedCss}`
    : baseStylesheet;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const archive = archiver("zip", {
      zlib: { level: compressionLevel === "fast" ? 1 : 9 },
    });

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    archive.append("application/epub+zip", { name: "mimetype", store: true });
    archive.append(getContainerXML(), { name: "META-INF/container.xml" });
    archive.append(fullStylesheet, { name: "OEBPS/stylesheet.css" });
    archive.append(buildContentOpf(title, author, chapters), { name: "OEBPS/content.opf" });
    archive.append(buildTocNcx(title, chapters), { name: "OEBPS/toc.ncx" });

    chapters.forEach((chapter, index) => {
      archive.append(buildChapterXhtml(chapter), { name: `OEBPS/chapter${index + 1}.xhtml` });
      log.debug("added chapter", { index: index + 1, title: chapter.title });
    });

    archive.finalize();
  });
}
