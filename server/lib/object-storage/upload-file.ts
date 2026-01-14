import { logger } from "../../common/logger";
import { uploadBuffer } from "./upload-buffer";

const log = logger.child({ module: "object-storage" });

export async function uploadFile(
  uploadUrl: string,
  filePath: string,
  contentType: string
): Promise<void> {
  const fs = await import("fs");
  log.debug("reading file for upload", { path: filePath });
  
  const buffer = await fs.promises.readFile(filePath);
  log.debug("read file buffer", { bytes: buffer.length });
  
  await uploadBuffer(uploadUrl, buffer, contentType);
}
