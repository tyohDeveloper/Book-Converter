import type { ContentFragment } from "./types";

export function composeSingleFragment(fragment: ContentFragment): string {
  return fragment.bodyHtml;
}
