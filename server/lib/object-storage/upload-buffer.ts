import { logger } from "../../common/logger";

const log = logger.child({ module: "object-storage" });

export async function uploadBuffer(
  uploadUrl: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });
  
  if (!response.ok) {
    const responseText = await response.text().catch(() => 'Unable to read response body');
    log.error("upload failed", { status: response.status, body: responseText });
    throw new Error(`Failed to upload to cloud storage: ${response.status} - ${responseText}`);
  }
  
  log.info("upload successful");
}
