import { isChapterFilename } from "./is-chapter-filename";
import { contentStartsWithChapterHeading } from "./content-starts-with-chapter-heading";

export function shouldInjectChapterHeading(filename: string, contentHtml: string): boolean {
  return isChapterFilename(filename) && !contentStartsWithChapterHeading(contentHtml);
}
