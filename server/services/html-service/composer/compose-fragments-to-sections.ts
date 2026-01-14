import { buildFileToc, toTocEntries } from "../../../lib/html-builder/toc-builder";
import type { ComposeSectionOptions } from "./types";

export function composeFragmentsToSections(options: ComposeSectionOptions): string {
  const { fragments, includeToc = true } = options;
  
  const tocHtml = includeToc && fragments.length > 1 
    ? buildFileToc(toTocEntries(fragments.map(f => ({ name: f.name, fileId: f.id }))))
    : "";
  
  const sectionsHtml = fragments.map(f => 
    `<section id="${f.id}">\n${f.bodyHtml}</section>`
  ).join("\n\n");
  
  return tocHtml + sectionsHtml;
}
