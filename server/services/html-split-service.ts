import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileManager } from "../lib/file-manager/file-manager";
import type { ManagedFile } from "../lib/file-manager/types";
import { sanitizeFilenameForChapter } from "../lib/file-manager/sanitize";
import { isHtmlFile } from "../lib/file-manager/is-html-file";
import { extractChaptersWithCss } from "../lib/epub/html-parser";
import { buildXhtml } from "../lib/xhtml/build-xhtml";
import { ConversionError } from "../common/errors/specific-errors";
import { logger } from "../common/logger";
import { config } from "../common/config";

const log = logger.child({ service: "html-split" });

export interface SplitHtmlSettings {
  excludeToc?: boolean;
  outputFormat?: 'zip' | 'individual';
}

export interface SplitHtmlResult {
  success: boolean;
  file?: ManagedFile;
  files?: ManagedFile[];
  chapterCount: number;
}


export async function splitHtmlToChapters(
  sessionId: string,
  fileId: string,
  settings: SplitHtmlSettings = {}
): Promise<SplitHtmlResult> {
  let tempFilePath: string | null = null;
  let zipTempPath: string | null = null;

  try {
    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new ConversionError("File not found");
    }

    if (!isHtmlFile(file.originalName)) {
      throw new ConversionError("File must be an HTML or XHTML file");
    }

    log.info("Splitting HTML into chapters", { fileName: file.originalName });

    tempFilePath = await fileManager.downloadToTempFile(sessionId, fileId);
    const htmlContent = await fs.promises.readFile(tempFilePath, 'utf-8');
    
    const { chapters: extractedChapters, sharedCss } = extractChaptersWithCss(htmlContent, { preserveHeadings: true });
    let chapters = extractedChapters;
    
    const excludeToc = settings.excludeToc !== false;
    if (excludeToc && chapters.length > 0) {
      const firstTitle = chapters[0].title.toLowerCase();
      if (firstTitle.includes('table of contents') || firstTitle === 'toc' || firstTitle === 'contents') {
        chapters = chapters.slice(1);
      }
    }

    if (chapters.length === 0) {
      throw new ConversionError("No chapters found in HTML file");
    }

    const outputFormat = settings.outputFormat || 'zip';
    const htmlTitle = file.originalName.replace(/\.(html?|xhtml)$/i, "");
    const inlineStyles = sharedCss ? [sharedCss] : [];

    if (outputFormat === 'individual') {
      const outputFiles: ManagedFile[] = [];
      
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const xhtmlContent = buildXhtml({ 
          title: chapter.title, 
          content: chapter.content, 
          styles: { inline: inlineStyles },
          skipCss: inlineStyles.length === 0,
          normalizeContent: true 
        });
        
        const paddedNum = String(i + 1).padStart(3, "0");
        const safeTitle = sanitizeFilenameForChapter(chapter.title).substring(0, 50);
        const filename = `${paddedNum}-${safeTitle}.xhtml`;
        
        const chapterTempPath = path.join(config.uploads.baseDir, `html-chapter-${Date.now()}-${i}.xhtml`);
        await fs.promises.writeFile(chapterTempPath, xhtmlContent, 'utf-8');
        
        const outputFile = await fileManager.addOutputFile(sessionId, filename, chapterTempPath, "xhtml");
        outputFiles.push(outputFile);
        
        await fs.promises.unlink(chapterTempPath).catch(() => {});
      }

      log.info("HTML split complete (individual files)", { chapterCount: chapters.length });

      return { 
        success: true,
        files: outputFiles,
        chapterCount: chapters.length,
      };
    }

    zipTempPath = path.join(config.uploads.baseDir, `html-chapters-${Date.now()}.zip`);
    
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipTempPath!);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", resolve);
      archive.on("error", reject);

      archive.pipe(output);

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const xhtmlContent = buildXhtml({ 
          title: chapter.title, 
          content: chapter.content, 
          styles: { inline: inlineStyles },
          skipCss: inlineStyles.length === 0,
          normalizeContent: true 
        });
        
        const paddedNum = String(i + 1).padStart(3, "0");
        const safeTitle = sanitizeFilenameForChapter(chapter.title).substring(0, 50);
        const filename = `${paddedNum}-${safeTitle}.xhtml`;
        
        archive.append(xhtmlContent, { name: filename });
      }

      archive.finalize();
    });

    const zipFileName = `${sanitizeFilenameForChapter(htmlTitle)}-chapters.zip`;
    const outputFile = await fileManager.addOutputFile(sessionId, zipFileName, zipTempPath, "zip");

    log.info("HTML split complete", { 
      fileName: zipFileName, 
      fileId: outputFile.id, 
      chapterCount: chapters.length 
    });

    return { 
      success: true,
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
