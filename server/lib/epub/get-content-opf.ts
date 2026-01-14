import type { EPUBOptions } from "./types";
import { buildContentOpf } from "./build-content-opf";

export function getContentOPF(options: EPUBOptions): string {
  const chapters = options.chapters.length > 0
    ? options.chapters.map((_, i) => ({
        id: `chapter${i + 1}`,
        href: `chapter${i + 1}.xhtml`,
      }))
    : [{ id: "chapter1", href: "chapter1.xhtml" }];

  return buildContentOpf({
    title: options.title,
    author: options.author,
    language: "en",
    chapters,
    includeStylesheet: true,
  });
}
