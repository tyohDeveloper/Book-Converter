import { buildFileToc as buildFileTocBase, toTocEntries } from "../../lib/html-builder/toc-builder";

export function buildFileToc(chapters: { title: string; id: string }[]): string {
  return buildFileTocBase(toTocEntries(chapters), true);
}
