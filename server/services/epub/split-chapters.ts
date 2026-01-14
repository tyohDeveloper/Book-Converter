import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileManager } from "../../lib/file-manager/file-manager";
import { parseEpub, extractBodyContent } from "../../lib/epub/parser";
import { buildXhtml } from "../../lib/xhtml/build-xhtml";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import type { SplitEpubSettings, SplitEpubResult } from "./types";
import { isEpubFile, sanitizeFilenameForChapter } from "./utils";

const log = logger.child({ service: "epub" });

const TOC_PATTERNS = [
  /^toc\.x?html?$/i,
  /^nav\.x?html?$/i,
  /table.?of.?contents/i,
  /^contents\.x?html?$/i,
];

function normalizeHref(href: string): string {
  let normalized = href.split('#')[0].split('?')[0];
  normalized = normalized.split('/').pop() || normalized;
  return normalized.toLowerCase();
}

function isTocChapter(href: string, title: string): boolean {
  const filename = normalizeHref(href);
  const normalizedTitle = title.toLowerCase();
  
  for (const pattern of TOC_PATTERNS) {
    if (pattern.test(filename) || pattern.test(normalizedTitle)) {
      return true;
    }
  }
  
  return false;
}

export async function splitEpubToChapters(
  sessionId: string,
  fileId: string,
  settings: SplitEpubSettings = {}
): Promise<SplitEpubResult> {
  let tempFilePath: string | null = null;
  let zipTempPath: string | null = null;

  try {
    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new ConversionError("File not found");
    }

    if (!isEpubFile(file.originalName)) {
      throw new ConversionError("File must be an EPUB");
    }

    log.info("Splitting EPUB into chapters", { fileName: file.originalName });

    tempFilePath = await fileManager.downloadToTempFile(sessionId, fileId);
    const parsed = await parseEpub(tempFilePath);

    const excludeToc = settings.excludeToc !== false;
    const outputFormat = settings.outputFormat || 'zip';
    
    let chapters = parsed.chapters;
    if (excludeToc) {
      chapters = chapters.filter(ch => !isTocChapter(ch.href, ch.title));
    }

    if (chapters.length === 0) {
      throw new ConversionError("No chapters found in EPUB");
    }

    const styles = parsed.stylesheets.map(s => s.content);
    const epubTitle = parsed.metadata.title || file.originalName.replace(/\.epub$/i, "");

    if (outputFormat === 'individual') {
      const outputFiles = [];
      
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const bodyContent = extractBodyContent(chapter.content);
        const xhtmlContent = buildXhtml({ title: chapter.title, content: bodyContent, styles: { inline: styles }, normalizeContent: true });
        
        const paddedNum = String(i + 1).padStart(3, "0");
        const safeTitle = sanitizeFilenameForChapter(chapter.title).substring(0, 50);
        const filename = `${paddedNum}-${safeTitle}.xhtml`;
        
        const chapterTempPath = path.join(config.uploads.baseDir, `chapter-${Date.now()}-${i}.xhtml`);
        await fs.promises.writeFile(chapterTempPath, xhtmlContent, 'utf-8');
        
        const outputFile = await fileManager.addOutputFile(sessionId, filename, chapterTempPath, "xhtml");
        outputFiles.push(outputFile);
        
        await fs.promises.unlink(chapterTempPath).catch(() => {});
      }

      log.info("EPUB split complete (individual files)", { 
        chapterCount: chapters.length 
      });

      return { 
        files: outputFiles,
        chapterCount: chapters.length,
      };
    }

    zipTempPath = path.join(config.uploads.baseDir, `chapters-${Date.now()}.zip`);
    
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipTempPath!);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => resolve());
      archive.on("error", reject);
      archive.pipe(output);

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const bodyContent = extractBodyContent(chapter.content);
        const xhtmlContent = buildXhtml({ title: chapter.title, content: bodyContent, styles: { inline: styles }, normalizeContent: true });
        
        const paddedNum = String(i + 1).padStart(3, "0");
        const safeTitle = sanitizeFilenameForChapter(chapter.title).substring(0, 50);
        const filename = `${paddedNum}-${safeTitle}.xhtml`;
        
        archive.append(xhtmlContent, { name: filename });
      }

      archive.finalize();
    });

    const zipFileName = `${sanitizeFilenameForChapter(epubTitle)}-chapters.zip`;
    const outputFile = await fileManager.addOutputFile(sessionId, zipFileName, zipTempPath, "zip");

    log.info("EPUB split complete", { 
      fileName: zipFileName, 
      fileId: outputFile.id, 
      chapterCount: chapters.length 
    });

    return { 
      file: outputFile,
      chapterCount: chapters.length,
    };
  } finally {
    if (tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    if (zipTempPath) {
      await fs.promises.unlink(zipTempPath).catch(() => {});
    }
  }
}
