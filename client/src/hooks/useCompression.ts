import { useState, useEffect, useCallback } from "react";
import { listFiles } from "@/lib/file-manager/list-files";
import { optimizeFile } from "@/lib/file-manager/optimize-file";
import { downloadFile } from "@/lib/file-manager/download-file";
import type { ManagedFile, ProgressUpdate } from "@/lib/file-manager/types";
import { useAsyncAction } from "./useAsyncAction";

export type CompressState = "loading" | "idle" | "compressing" | "complete" | "error";

export interface CompressionResult {
  fileId: string;
  filename: string;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
}

export function useCompression(fileIds: string[]) {
  const [file, setFile] = useState<ManagedFile | null>(null);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);

  const compressAction = useAsyncAction<CompressionResult>(
    async (signal) => {
      if (!file) throw new Error("No file selected");
      setProgress(null);
      try {
        const res = await optimizeFile(file.id, setProgress, signal);
        return {
          fileId: res.file.id,
          filename: res.file.name,
          originalSize: res.originalSize,
          optimizedSize: res.optimizedSize,
          reductionPercent: res.reductionPercent,
        };
      } finally {
        setProgress(null);
      }
    },
    {
      loading: "Compressing PDF...",
      success: (res) => `Reduced by ${res.reductionPercent.toFixed(1)}%`,
      error: (err) => err.name === "AbortError" ? null : err.message || "Failed to compress PDF",
      cancelled: "Compression cancelled",
    }
  );

  const downloadAction = useAsyncAction(
    async () => {
      if (!compressAction.result) throw new Error("No result");
      await downloadFile(compressAction.result.fileId);
      return true;
    },
    { loading: "Starting download...", success: "Downloaded!", error: "Failed to download" }
  );

  useEffect(() => {
    async function loadFile() {
      if (fileIds.length === 0) {
        setInitState("error");
        setInitError("No file selected. Please select a file from the home page.");
        return;
      }
      try {
        const allFiles = await listFiles();
        const matchedFile = allFiles.find(f => fileIds.includes(f.id));
        if (matchedFile) {
          setFile(matchedFile);
          setInitState("ready");
        } else {
          setInitState("error");
          setInitError("File not found. Please select a file from the home page.");
        }
      } catch (err) {
        setInitState("error");
        setInitError(err instanceof Error ? err.message : "Failed to load file");
      }
    }
    loadFile();
  }, [fileIds.join(",")]);

  const state: CompressState = 
    initState === "loading" ? "loading" :
    initState === "error" ? "error" :
    compressAction.state === "loading" ? "compressing" :
    compressAction.state === "complete" ? "complete" :
    compressAction.state === "error" ? "error" : "idle";

  const error = initError || compressAction.error;

  return {
    file,
    state,
    progress,
    result: compressAction.result,
    error,
    compress: compressAction.execute,
    cancel: compressAction.cancel,
    download: downloadAction.execute,
  };
}
