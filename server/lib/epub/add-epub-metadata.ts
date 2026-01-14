import type { Archiver } from "archiver";
import type { ExtractedChapter } from "../pdf-extractor/types";
import type { ExtractedImage } from "../image-extractor";
import type { TypographySettings } from "@shared/contracts/settings";
import type { BookStylePreset } from "@shared/contracts/book-style-preset";
import { getContainerXML } from "./get-container-xml";
import { getContentOPFFromChapters } from "./get-content-opf-from-chapters";
import { getTOCNCXFromChapters } from "./get-toc-ncx-from-chapters";
import { getStylesheet } from "./stylesheet";

export interface AddMetadataOptions {
  title: string;
  author: string;
  chapters: ExtractedChapter[];
  images?: ExtractedImage[];
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
}

export function addEpubMetadataToArchive(
  archive: Archiver,
  options: AddMetadataOptions
): void {
  const { title, author, chapters, images, typography, bookStylePreset } = options;

  const stylesheetOptions = bookStylePreset 
    ? { typography, bookStylePreset } 
    : typography;

  archive.append("application/epub+zip", { name: "mimetype", store: true });
  archive.append(getContainerXML(), { name: "META-INF/container.xml" });
  archive.append(getStylesheet(stylesheetOptions), { name: "OEBPS/stylesheet.css" });
  archive.append(
    getContentOPFFromChapters(title, author, chapters, images),
    { name: "OEBPS/content.opf" }
  );
  archive.append(getTOCNCXFromChapters(title, chapters), {
    name: "OEBPS/toc.ncx",
  });
}
