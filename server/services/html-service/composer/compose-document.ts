import { buildXhtmlDocument } from "../../../lib/html-builder/build-xhtml-document";
import { composeFragmentsToSections } from "./compose-fragments-to-sections";
import { composeSingleFragment } from "./compose-single-fragment";
import type { ComposeDocumentOptions } from "./types";

export function composeDocument(options: ComposeDocumentOptions): string {
  const { title, fragments, includeToc = true, typography, skipCss = false } = options;
  
  let content: string;
  if (fragments.length === 1) {
    content = composeSingleFragment(fragments[0]);
  } else {
    content = composeFragmentsToSections({ fragments, includeToc });
  }
  
  return buildXhtmlDocument({ title, content, typography, skipCss });
}
