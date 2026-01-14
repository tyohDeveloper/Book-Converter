import type { EPUBOptions } from "./types";
import { buildTocNcx } from "./build-toc-ncx";

export function getTOCNCX(options: EPUBOptions): string {
  const chapters = options.chapters.length > 0
    ? options.chapters.map((ch, i) => ({
        id: `navPoint-${i + 1}`,
        href: `chapter${i + 1}.xhtml`,
        title: ch.title,
      }))
    : [{ id: "navPoint-1", href: "chapter1.xhtml", title: "Content" }];

  return buildTocNcx({ title: options.title, chapters });
}
