import type { ExtractedChapter } from "../pdf-extractor/types";
import type { ExtractedImage } from "../image-extractor";
import { buildContentOpf } from "./build-content-opf";

export function getContentOPFFromChapters(
  title: string,
  author: string,
  chapters: ExtractedChapter[],
  images?: ExtractedImage[]
): string {
  const chapterItems = chapters.length > 0
    ? chapters.map((_, i) => ({
        id: `chapter${i + 1}`,
        href: `chapter${i + 1}.xhtml`,
      }))
    : [{ id: "chapter1", href: "chapter1.xhtml" }];

  const imageItems = (images || []).map((img, i) => ({
    id: `image${i + 1}`,
    href: `images/${img.id}.${img.type === "image/png" ? "png" : "jpg"}`,
    mediaType: img.type,
  }));

  return buildContentOpf({
    title,
    author,
    language: "en",
    chapters: chapterItems,
    images: imageItems,
    includeStylesheet: true,
  });
}
