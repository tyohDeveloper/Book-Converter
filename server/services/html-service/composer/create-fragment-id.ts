import { sanitizeFragmentId } from "./sanitize-fragment-id";

export function createFragmentId(fileId: string): string {
  return `file-${sanitizeFragmentId(fileId)}`;
}
