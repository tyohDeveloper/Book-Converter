import { logger } from "../../common/logger";
import { REPLIT_SIDECAR_ENDPOINT, type SignRequest } from "./types";

const log = logger.child({ module: "object-storage" });

export async function signObjectURL(request: SignRequest): Promise<string> {
  const { bucketName, objectName, method, ttlSec, contentType } = request;
  
  const body: Record<string, unknown> = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  
  if (contentType) {
    body.content_type = contentType;
  }
  
  log.debug("signing URL", { bucket: bucketName, object: objectName, method });
  
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  
  if (!response.ok) {
    const responseText = await response.text().catch(() => 'Unable to read response body');
    log.error("failed to sign URL", { status: response.status, body: responseText });
    throw new Error(`Failed to sign object URL: ${response.status} - ${responseText}`);
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

export function buildObjectPath(sessionId: string, fileId: string): string {
  return `.private/sessions/${sessionId}/${fileId}`;
}
