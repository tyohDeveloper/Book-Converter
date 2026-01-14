import { downloadToBuffer } from "./download-to-buffer";

export async function downloadToFile(downloadUrl: string, destPath: string): Promise<void> {
  const fs = await import("fs");
  const buffer = await downloadToBuffer(downloadUrl);
  await fs.promises.writeFile(destPath, buffer);
}
