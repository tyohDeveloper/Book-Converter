import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { listFiles } from "@/lib/file-manager/list-files";
import { combinePdfs } from "@/lib/file-manager/combine-pdfs";
import { downloadFile } from "@/lib/file-manager/download-file";
import type { ManagedFile } from "@/lib/file-manager/types";
import { useAsyncAction } from "./useAsyncAction";

export type CombineState = "loading" | "idle" | "combining" | "complete" | "error";

export interface CombineResult {
  fileId: string;
  filename: string;
  size: number;
}

export function useCombine(initialFileIds: string[]) {
  const [availableFiles, setAvailableFiles] = useState<ManagedFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputName, setOutputName] = useState("combined.pdf");

  const combineAction = useAsyncAction<CombineResult>(
    async () => {
      if (selectedIds.length < 2) throw new Error("Select at least 2 files");
      const res = await combinePdfs(selectedIds, outputName);
      return { fileId: res.file.id, filename: res.file.name, size: res.file.size };
    },
    {
      loading: "Combining PDFs...",
      success: "PDFs combined successfully!",
      error: (err) => err.message || "Failed to combine PDFs",
    }
  );

  const downloadAction = useAsyncAction(
    async () => {
      if (!combineAction.result) throw new Error("No result");
      await downloadFile(combineAction.result.fileId);
      return true;
    },
    { loading: "Starting download...", success: "Downloaded!", error: "Failed to download" }
  );

  useEffect(() => {
    async function loadFiles() {
      try {
        const allFiles = await listFiles();
        const pdfFiles = allFiles.filter(f => f.name.toLowerCase().endsWith(".pdf") && !f.isOutput);
        setAvailableFiles(pdfFiles);

        const ids = initialFileIds.length > 0
          ? initialFileIds.filter(id => pdfFiles.some(f => f.id === id))
          : pdfFiles.map(f => f.id);

        setSelectedIds(ids);
        if (pdfFiles.length === 0) {
          setInitState("error");
          setInitError("No PDF files available to combine.");
        } else {
          setInitState("ready");
        }
      } catch (err) {
        setInitState("error");
        setInitError(err instanceof Error ? err.message : "Failed to load files");
      }
    }
    loadFiles();
  }, [initialFileIds.join(",")]);

  const selectedFiles = availableFiles.filter(f => selectedIds.includes(f.id));

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedIds(prev => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      return newOrder;
    });
  }, []);

  const toggleFile = useCallback((fileId: string) => {
    setSelectedIds(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  }, []);

  const combine = useCallback(async () => {
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 files to combine");
      return;
    }
    await combineAction.execute();
  }, [selectedIds.length, combineAction.execute]);

  const state: CombineState =
    initState === "loading" ? "loading" :
    initState === "error" ? "error" :
    combineAction.state === "loading" ? "combining" :
    combineAction.state === "complete" ? "complete" :
    combineAction.state === "error" ? "error" : "idle";

  const error = initError || combineAction.error;

  return {
    availableFiles,
    selectedFiles,
    selectedIds,
    state,
    result: combineAction.result,
    error,
    outputName,
    setOutputName,
    reorder,
    toggleFile,
    combine,
    download: downloadAction.execute,
  };
}
