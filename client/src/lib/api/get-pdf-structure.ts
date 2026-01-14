import type { PDFStructure } from "./types";

export async function getPDFStructure(file: File, signal?: AbortSignal): Promise<PDFStructure> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/pdf-structure", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to analyze PDF structure" }));
    throw new Error(error.details || error.error || "Failed to analyze PDF structure");
  }

  return response.json();
}
