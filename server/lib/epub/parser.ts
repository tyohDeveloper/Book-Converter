import JSZip from "jszip";
import fs from "fs/promises";
import { logger } from "../../common/logger";
import { parseXML } from "./xml-helpers";
import { findRootFilePath } from "./parsers/container-parser";
import { parseMetadata, parseManifest, parseSpine } from "./parsers/metadata-parser";
import { parseTocNcx, extractTitleFromXhtml } from "./parsers/toc-parser";
import type { EpubChapter, ParsedEpub } from "./parser-types";

export type { EpubChapter, EpubMetadata, ManifestItem, SpineItem, ParsedEpub, TocItem } from "./parser-types";

const log = logger.child({ service: "epub-parser" });

export async function parseEpub(filePath: string): Promise<ParsedEpub> {
  log.info("Parsing EPUB file", { path: filePath });
  
  const fileBuffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);
  
  const rootFilePath = await findRootFilePath(zip);
  const rootDir = rootFilePath.includes("/") ? 
                  rootFilePath.substring(0, rootFilePath.lastIndexOf("/")) : "";
  
  const opfContent = await zip.file(rootFilePath)?.async("string");
  if (!opfContent) {
    throw new Error("Invalid EPUB: OPF file not found");
  }
  
  const opfDoc = parseXML(opfContent);
  const metadata = parseMetadata(opfDoc);
  const manifest = parseManifest(opfDoc);
  const spine = parseSpine(opfDoc);
  
  const ncxItem = manifest.find(item => 
    item.mediaType === "application/x-dtbncx+xml" || item.id === "ncx"
  );
  
  const tocItems = ncxItem ? await parseTocNcx(zip, ncxItem.href, rootDir) : [];
  
  const chapters = await loadChapters(zip, manifest, spine, tocItems, rootDir);
  const stylesheets = await loadStylesheets(zip, manifest, rootDir);
  const images = await loadImages(zip, manifest, rootDir);
  
  log.info("EPUB parsed successfully", { 
    title: metadata.title, 
    chapters: chapters.length,
    images: images.length,
    stylesheets: stylesheets.length 
  });
  
  return { metadata, manifest, spine, chapters, tocItems, stylesheets, images, rootPath: rootDir };
}

async function loadChapters(
  zip: JSZip,
  manifest: { id: string; href: string; mediaType: string }[],
  spine: { idref: string; linear?: boolean }[],
  tocItems: { src: string; title: string; playOrder: number }[],
  rootDir: string
): Promise<EpubChapter[]> {
  const chapters: EpubChapter[] = [];
  const xhtmlItems = manifest.filter(item => 
    item.mediaType === "application/xhtml+xml" || item.mediaType === "text/html"
  );
  
  const spineOrder = new Map(spine.map((s, i) => [s.idref, i]));
  const orderedXhtml = xhtmlItems.sort((a, b) => {
    const orderA = spineOrder.get(a.id) ?? 999;
    const orderB = spineOrder.get(b.id) ?? 999;
    return orderA - orderB;
  });
  
  for (let i = 0; i < orderedXhtml.length; i++) {
    const item = orderedXhtml[i];
    const fullPath = rootDir ? `${rootDir}/${item.href}` : item.href;
    const content = await zip.file(fullPath)?.async("string");
    
    if (content) {
      const tocEntry = tocItems.find(t => t.src.split("#")[0] === item.href);
      const title = tocEntry?.title || extractTitleFromXhtml(content) || `Chapter ${i + 1}`;
      
      chapters.push({
        id: item.id,
        href: item.href,
        title,
        content,
        playOrder: tocEntry?.playOrder ?? i + 1,
      });
    }
  }
  
  return chapters;
}

async function loadStylesheets(
  zip: JSZip,
  manifest: { href: string; mediaType: string }[],
  rootDir: string
): Promise<{ href: string; content: string }[]> {
  const stylesheets: { href: string; content: string }[] = [];
  const cssItems = manifest.filter(item => item.mediaType === "text/css");
  
  for (const item of cssItems) {
    const fullPath = rootDir ? `${rootDir}/${item.href}` : item.href;
    const content = await zip.file(fullPath)?.async("string");
    if (content) {
      stylesheets.push({ href: item.href, content });
    }
  }
  
  return stylesheets;
}

async function loadImages(
  zip: JSZip,
  manifest: { href: string; mediaType: string }[],
  rootDir: string
): Promise<{ href: string; data: Buffer; mediaType: string }[]> {
  const images: { href: string; data: Buffer; mediaType: string }[] = [];
  const imageItems = manifest.filter(item => item.mediaType.startsWith("image/"));
  
  for (const item of imageItems) {
    const fullPath = rootDir ? `${rootDir}/${item.href}` : item.href;
    const data = await zip.file(fullPath)?.async("nodebuffer");
    if (data) {
      images.push({ href: item.href, data, mediaType: item.mediaType });
    }
  }
  
  return images;
}

export function extractBodyContent(xhtmlContent: string): string {
  const bodyMatch = xhtmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1].trim() : xhtmlContent;
}
