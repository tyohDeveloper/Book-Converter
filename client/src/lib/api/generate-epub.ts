import type { GenerateEPUBSettings } from "./types";

export async function generateEPUB(files: File[], settings: GenerateEPUBSettings, signal?: AbortSignal): Promise<Blob> {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append("files", file);
  });
  
  formData.append("settings", JSON.stringify(settings));

  const response = await fetch("/api/generate-epub", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to generate EPUB" }));
    throw new Error(error.details || error.error || "Failed to generate EPUB");
  }

  return response.blob();
}
