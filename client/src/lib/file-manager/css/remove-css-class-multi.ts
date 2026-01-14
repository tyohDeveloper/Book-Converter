import { getHeaders } from "../../session";
import type { ManagedFile } from "../types";

export interface RemoveClassMultiResult {
  files: ManagedFile[];
  totalElementsUpdated: number;
}

export async function removeCssClassMulti(
  fileIds: string[],
  className: string,
  signal?: AbortSignal
): Promise<RemoveClassMultiResult> {
  const response = await fetch('/api/tools/html-css-multi/remove-class', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds, className }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove class' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
