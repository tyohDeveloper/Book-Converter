import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { withAsyncToast } from "@/lib/async-toast";
import { listFiles } from "@/lib/file-manager/list-files";
import { getPDFDebugInfo, type PDFDebugInfo, type DebugMode } from "@/lib/pdf-debug-api";
import type { ManagedFile } from "@/lib/file-manager/types";

export type DebugState = "loading" | "ready" | "analyzing" | "results" | "error";

export function usePdfDebug(fileIdParam: string | null) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [state, setState] = useState<DebugState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<PDFDebugInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState<DebugMode>("textBlocks");

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const allFiles = await listFiles();
        const pdfFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
        setFiles(pdfFiles);

        if (fileIdParam && pdfFiles.find(f => f.id === fileIdParam)) {
          setSelectedFileId(fileIdParam);
        } else if (pdfFiles.length > 0) {
          setSelectedFileId(pdfFiles[0].id);
        }

        setState("ready");
      } catch (err: any) {
        setState("error");
        setError(err.message || "Failed to load files");
      }
    };

    loadFiles();
  }, [fileIdParam]);

  const analyze = useCallback(async () => {
    if (!selectedFileId) {
      toast.error("No file selected");
      return;
    }

    setState("analyzing");

    try {
      const info = await withAsyncToast(
        () => getPDFDebugInfo(selectedFileId, mode, { start: currentPage, end: currentPage }),
        {
          loading: "Extracting PDF content...",
          success: (info) => `Loaded page ${currentPage} of ${info.numPages}`,
          error: (err) => err.message || "Failed to analyze PDF"
        }
      );
      setDebugInfo(info);
      setState("results");
    } catch {
      setState("ready");
    }
  }, [selectedFileId, mode, currentPage]);

  const loadPage = useCallback(async (pageNum: number) => {
    if (!selectedFileId || !debugInfo) return;

    setCurrentPage(pageNum);

    try {
      const info = await withAsyncToast(
        () => getPDFDebugInfo(selectedFileId, mode, { start: pageNum, end: pageNum }),
        {
          loading: `Loading page ${pageNum}...`,
          success: `Page ${pageNum} loaded`,
          error: (err) => err.message || "Failed to load page"
        }
      );
      setDebugInfo(info);
    } catch {
      // Error handled by withAsyncToast
    }
  }, [selectedFileId, debugInfo, mode]);

  const switchMode = useCallback(async (newMode: DebugMode) => {
    if (!selectedFileId) return;

    setMode(newMode);

    try {
      const info = await withAsyncToast(
        () => getPDFDebugInfo(selectedFileId, newMode, { start: currentPage, end: currentPage }),
        {
          loading: `Switching to ${newMode} view...`,
          success: `Switched to ${newMode} view`,
          error: (err) => err.message || "Failed to switch mode"
        }
      );
      setDebugInfo(info);
    } catch {
      // Error handled by withAsyncToast
    }
  }, [selectedFileId, currentPage]);

  const selectedFile = files.find(f => f.id === selectedFileId);

  return {
    files,
    selectedFileId,
    setSelectedFileId,
    state,
    error,
    debugInfo,
    currentPage,
    mode,
    selectedFile,
    analyze,
    loadPage,
    switchMode,
  };
}
