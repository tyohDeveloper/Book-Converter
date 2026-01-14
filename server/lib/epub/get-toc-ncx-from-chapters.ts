import type { ExtractedChapter } from "../pdf-extractor/types";
import { buildTocNcx } from "./build-toc-ncx";

export function getTOCNCXFromChapters(
  title: string,
  chapters: ExtractedChapter[]
): string {
  const chapterItems = chapters.map((ch, i) => ({
    id: `navPoint-${i + 1}`,
    href: `chapter${i + 1}.xhtml`,
    title: ch.title,
  }));

  return buildTocNcx({ title, chapters: chapterItems });
}
