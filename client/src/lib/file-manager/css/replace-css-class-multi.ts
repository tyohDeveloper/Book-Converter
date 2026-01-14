import { getHeaders } from "../../session";
import type { ManagedFile } from "../types";

export interface ReplaceClassMultiResult {
  files: ManagedFile[];
  totalElementsUpdated: number;
}

export async function replaceCssClassMulti(
  fileIds: string[],
  sourceClass: string,
  targetClass: string,
  signal?: AbortSignal
): Promise<ReplaceClassMultiResult> {
  const response = await fetch('/api/tools/html-css-multi/replace-class', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds, sourceClass, targetClass }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to replace class' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
