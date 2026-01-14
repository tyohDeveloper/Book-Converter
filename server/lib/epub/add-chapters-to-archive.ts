import fs from "fs";
import type { Archiver } from "archiver";
import type { ExtractedChapter } from "../pdf-extractor/types";
import type { ExtractedImage } from "../image-extractor";
import { writeChapterToTempFile } from "./chapter-builder";
import { logger } from "../../common/logger";

const log = logger.child({ module: "epub-generator" });

export interface AddChaptersOptions {
  chapters: ExtractedChapter[];
  images?: ExtractedImage[];
  includeTableOfContents?: boolean;
}

export interface AddChaptersResult {
  tempXhtmlFiles: string[];
}

export async function addChaptersToArchive(
  archive: Archiver,
  options: AddChaptersOptions
): Promise<AddChaptersResult> {
  const { chapters, images, includeTableOfContents = false } = options;
  const tempXhtmlFiles: string[] = [];

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const includeTocForChapter = i === 0 && includeTableOfContents;

    const tempXhtmlPath = await writeChapterToTempFile(
      chapter,
      i,
      includeTocForChapter
    );
    tempXhtmlFiles.push(tempXhtmlPath);

    archive.file(tempXhtmlPath, { name: `OEBPS/chapter${i + 1}.xhtml` });

    if ((i + 1) % 10 === 0 || i === chapters.length - 1) {
      log.debug("processed chapters", { current: i + 1, total: chapters.length });
    }
  }

  if (images && images.length > 0) {
    for (const img of images) {
      if (fs.existsSync(img.path)) {
        const ext = img.type === "image/png" ? "png" : "jpg";
        archive.file(img.path, { name: `OEBPS/images/${img.id}.${ext}` });
      }
    }
  }

  return { tempXhtmlFiles };
}
