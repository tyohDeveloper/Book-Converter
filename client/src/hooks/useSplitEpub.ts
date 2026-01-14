import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { listFiles } from "@/lib/file-manager/list-files";
import { splitEpubToChapters } from "@/lib/file-manager/epub";
import { downloadFile } from "@/lib/file-manager/download-file";
import { isEpubFile } from "@/lib/file-manager/utils";
import type { ManagedFile, OutputFileResult } from "@/lib/file-manager/types";

type ConversionState = "loading" | "ready" | "converting" | "complete" | "error";
type OutputFormat = "zip" | "individual";

export interface SplitEpubSettings {
  excludeToc: boolean;
  outputFormat: OutputFormat;
}

export interface UseSplitEpubOptions {
  initialFileIds: string[];
}

export interface UseSplitEpubResult {
  epubFile: ManagedFile | null;
  state: ConversionState;
  error: string | null;
  outputFile: OutputFileResult | null;
  outputFiles: OutputFileResult[];
  chapterCount: number;
  settings: SplitEpubSettings;
  updateSettings: <K extends keyof SplitEpubSettings>(key: K, value: SplitEpubSettings[K]) => void;
  split: () => Promise<void>;
  download: () => void;
}

interface SplitResult {
  success: boolean;
  chapterCount: number;
  file?: OutputFileResult;
  files?: OutputFileResult[];
}

export function useSplitEpub({ initialFileIds }: UseSplitEpubOptions): UseSplitEpubResult {
  const [epubFile, setEpubFile] = useState<ManagedFile | null>(null);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFileResult | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFileResult[]>([]);
  const [chapterCount, setChapterCount] = useState<number>(0);
  const [settings, setSettings] = useState<SplitEpubSettings>({
    excludeToc: true,
    outputFormat: "zip",
  });

  useEffect(() => {
    if (initialFileIds.length === 0) {
      setInitError("No files selected");
      setInitState("error");
      return;
    }

    listFiles()
      .then((allFiles: ManagedFile[]) => {
        const selectedFiles = allFiles.filter(f => initialFileIds.includes(f.id));
        const epubs = selectedFiles.filter(f => isEpubFile(f.name));
        
        if (epubs.length === 0) {
          setInitError("No EPUB file found. Please select one EPUB file.");
          setInitState("error");
          return;
        }
        
        if (epubs.length > 1) {
          setInitError("Please select only one EPUB file to split.");
          setInitState("error");
          return;
        }
        
        setEpubFile(epubs[0]);
        setInitState("ready");
      })
      .catch((err: Error) => {
        setInitError(err.message);
        setInitState("error");
      });
  }, [initialFileIds.join(',')]);

  const updateSettings = useCallback(<K extends keyof SplitEpubSettings>(key: K, value: SplitEpubSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const splitAction = useAsyncAction<SplitResult>(
    async () => {
      if (!epubFile) throw new Error("No EPUB file selected");
      const res = await splitEpubToChapters(epubFile.id, {
        excludeToc: settings.excludeToc,
        outputFormat: settings.outputFormat,
      });
      if (!res.success) throw new Error("Failed to split EPUB");
      return res;
    },
    {
      loading: "Splitting EPUB into chapters...",
      success: (res) => `Split into ${res.chapterCount} chapters!`,
      error: (err) => err.message || "Failed to split EPUB",
    }
  );

  const split = useCallback(async () => {
    if (!epubFile) return;
    const result = await splitAction.execute();
    if (result) {
      if (result.files) {
        setOutputFiles(result.files);
        setOutputFile(null);
      } else if (result.file) {
        setOutputFile(result.file);
        setOutputFiles([]);
      }
      setChapterCount(result.chapterCount);
    }
  }, [epubFile, splitAction.execute]);

  const download = useCallback(() => {
    if (outputFile) {
      downloadFile(outputFile.id);
    }
  }, [outputFile]);

  const state: ConversionState = initState === "loading" ? "loading"
    : initState === "error" ? "error"
    : splitAction.state === "loading" ? "converting"
    : splitAction.state === "complete" ? "complete"
    : splitAction.state === "error" ? "error"
    : "ready";

  const error = initError || splitAction.error;

  return {
    epubFile,
    state,
    error,
    outputFile,
    outputFiles,
    chapterCount,
    settings,
    updateSettings,
    split,
    download,
  };
}
