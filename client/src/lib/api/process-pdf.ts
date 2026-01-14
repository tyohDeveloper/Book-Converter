import type { ProcessedPDF } from "./types";

export async function processPDF(file: File, detectChapters: boolean, signal?: AbortSignal): Promise<ProcessedPDF> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("detectChapters", String(detectChapters));

  const response = await fetch("/api/process-pdf", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to process PDF" }));
    throw new Error(error.details || error.error || "Failed to process PDF");
  }

  return response.json();
}
