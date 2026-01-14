import { ObjectNotFoundError } from "./types";

export async function downloadToBuffer(downloadUrl: string): Promise<Buffer> {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    if (response.status === 404) {
      throw new ObjectNotFoundError();
    }
    throw new Error(`Failed to download file: ${response.status}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}
