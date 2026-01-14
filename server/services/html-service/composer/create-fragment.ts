import { createFragmentId } from "./create-fragment-id";
import type { ContentFragment } from "./types";

export function createFragment(name: string, fileId: string, bodyHtml: string): ContentFragment {
  return {
    id: createFragmentId(fileId),
    name,
    bodyHtml,
  };
}
