import type { Response } from "express";
import { ObjectNotFoundError } from "./types";
import { sanitizeFilenameForHeader } from "@shared/utils/filenames";

export async function streamToResponse(
  downloadUrl: string,
  res: Response,
  filename: string,
  contentType: string,
  inline: boolean = false
): Promise<void> {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    if (response.status === 404) {
      throw new ObjectNotFoundError();
    }
    throw new Error(`Failed to stream file: ${response.status}`);
  }
  
  const safeName = sanitizeFilenameForHeader(filename);
  const disposition = inline ? 'inline' : 'attachment';
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `${disposition}; filename="${safeName}"`);
  
  if (response.headers.get("content-length")) {
    res.setHeader("Content-Length", response.headers.get("content-length")!);
  }
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    reader.releaseLock();
    throw error;
  }
}
