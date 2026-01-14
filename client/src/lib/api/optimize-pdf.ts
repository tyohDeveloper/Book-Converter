import type { OptimizePDFResult } from "./types";

export async function optimizePDF(file: File, signal?: AbortSignal): Promise<OptimizePDFResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/optimize-pdf", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to optimize PDF" }));
    throw new Error(error.details || error.error || "Failed to optimize PDF");
  }

  const originalSize = parseInt(response.headers.get("X-Original-Size") || "0");
  const optimizedSize = parseInt(response.headers.get("X-Optimized-Size") || "0");
  const reductionPercent = parseFloat(response.headers.get("X-Reduction-Percent") || "0");

  const blob = await response.blob();
  
  const originalName = file.name || 'document.pdf';
  const lastDotIndex = originalName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
  const ext = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '.pdf';
  const filename = `${name}_optimized${ext}`;

  return {
    blob,
    originalSize,
    optimizedSize,
    reductionPercent,
    filename
  };
}
