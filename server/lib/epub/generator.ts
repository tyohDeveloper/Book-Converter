import JSZip from "jszip";
import archiver from "archiver";
import fs from "fs";
import type { EPUBOptions, EPUBOptionsWithChapterFiles, StreamingEPUBResult } from "./types";
import { getContainerXML } from "./get-container-xml";
import { getContentOPF } from "./get-content-opf";
import { getTOCNCX } from "./get-toc-ncx";
import { getStylesheet } from "./stylesheet";
import { buildChaptersFromTempFile, getChapterHTML } from "./chapter-builder";
import { getTempFilePath } from "../../domain/paths";
import { logger } from "../../common/logger";
import { addEpubMetadataToArchive } from "./add-epub-metadata";
import { addChaptersToArchive } from "./add-chapters-to-archive";
import { cleanupTempFiles } from "./cleanup-temp-files";

const log = logger.child({ module: "epub-generator" });

export async function generateEPUB(options: EPUBOptions): Promise<Buffer> {
  const zip = new JSZip();

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  const metaInf = zip.folder("META-INF");
  metaInf?.file("container.xml", getContainerXML());

  const stylesheetOptions = options.bookStylePreset 
    ? { typography: options.typography, bookStylePreset: options.bookStylePreset }
    : options.typography;

  const oebps = zip.folder("OEBPS");
  oebps?.file("stylesheet.css", getStylesheet(stylesheetOptions));

  const finalChapters = await resolveFinalChapters(options);

  oebps?.file("content.opf", getContentOPF({ ...options, chapters: finalChapters }));
  oebps?.file("toc.ncx", getTOCNCX({ ...options, chapters: finalChapters }));

  finalChapters.forEach((chapter, index) => {
    const chapterHTML = getChapterHTML(chapter, index);
    oebps?.file(`chapter${index + 1}.xhtml`, chapterHTML);
  });

  const compressionLevelNum = options.compressionLevel === "fast" ? 1 : 9;

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: compressionLevelNum },
  });

  return buffer;
}

async function resolveFinalChapters(options: EPUBOptions) {
  if (options.tempTextFile && fs.existsSync(options.tempTextFile)) {
    const chaptersWithContent = await buildChaptersFromTempFile(
      options.tempTextFile,
      options.chapters
    );

    try {
      await fs.promises.unlink(options.tempTextFile);
    } catch (e) {}

    return chaptersWithContent.length > 0
      ? chaptersWithContent
      : [{ title: "Content", page: 1, content: options.fullText }];
  }

  return options.chapters.length > 0 && options.chapters.some((c) => c.content?.trim())
    ? options.chapters
    : [{ title: "Content", page: 1, content: options.fullText }];
}

export async function generateEPUBFromChapterFiles(
  options: EPUBOptionsWithChapterFiles
): Promise<StreamingEPUBResult> {
  const tempEpubPath = getTempFilePath("streaming-epub", "epub");

  const chapters = options.chapters.length > 0
    ? options.chapters
    : [{ title: "Content", page: 1 }];
  const compressionLevel = options.compressionLevel === "fast" ? 1 : 9;

  let tempXhtmlFiles: string[] = [];

  await new Promise<void>(async (resolve, reject) => {
    const output = fs.createWriteStream(tempEpubPath);
    const archive = archiver("zip", { zlib: { level: compressionLevel } });

    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    try {
      addEpubMetadataToArchive(archive, {
        title: options.title,
        author: options.author,
        chapters,
        images: options.images,
        typography: options.typography,
        bookStylePreset: options.bookStylePreset,
      });

      const result = await addChaptersToArchive(archive, {
        chapters,
        images: options.images,
        includeTableOfContents: options.includeTableOfContents,
      });
      tempXhtmlFiles = result.tempXhtmlFiles;

      archive.finalize();
    } catch (err) {
      reject(err);
    }
  });

  await cleanupTempFiles(tempXhtmlFiles);

  const stats = await fs.promises.stat(tempEpubPath);

  log.info("generated streaming EPUB", {
    sizeMB: (stats.size / 1024 / 1024).toFixed(2),
    chapters: chapters.length,
  });

  return {
    filePath: tempEpubPath,
    size: stats.size,
    chapterCount: chapters.length,
  };
}
