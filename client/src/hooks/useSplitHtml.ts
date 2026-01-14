import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { listFiles } from "@/lib/file-manager/list-files";
import { splitHtmlToChapters } from "@/lib/file-manager/epub";
import { downloadFile } from "@/lib/file-manager/download-file";
import { isHtmlFile } from "@/lib/file-manager/utils";
import type { ManagedFile, OutputFileResult } from "@/lib/file-manager/types";

type ConversionState = "loading" | "ready" | "converting" | "complete" | "error";
type OutputFormat = "zip" | "individual";

export interface SplitHtmlSettings {
  excludeToc: boolean;
  outputFormat: OutputFormat;
}

export interface UseSplitHtmlOptions {
  initialFileIds: string[];
}

export interface UseSplitHtmlResult {
  htmlFile: ManagedFile | null;
  state: ConversionState;
  error: string | null;
  outputFile: OutputFileResult | null;
  outputFiles: OutputFileResult[];
  chapterCount: number;
  settings: SplitHtmlSettings;
  updateSettings: <K extends keyof SplitHtmlSettings>(key: K, value: SplitHtmlSettings[K]) => void;
  split: () => Promise<void>;
  download: () => void;
}

interface SplitResult {
  success: boolean;
  chapterCount: number;
  file?: OutputFileResult;
  files?: OutputFileResult[];
}

export function useSplitHtml({ initialFileIds }: UseSplitHtmlOptions): UseSplitHtmlResult {
  const [htmlFile, setHtmlFile] = useState<ManagedFile | null>(null);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFileResult | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFileResult[]>([]);
  const [chapterCount, setChapterCount] = useState<number>(0);
  const [settings, setSettings] = useState<SplitHtmlSettings>({
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
        const htmlFiles = selectedFiles.filter(f => isHtmlFile(f.name));
        
        if (htmlFiles.length === 0) {
          setInitError("No HTML/XHTML file found. Please select one HTML file.");
          setInitState("error");
          return;
        }
        
        if (htmlFiles.length > 1) {
          setInitError("Please select only one HTML file to split.");
          setInitState("error");
          return;
        }
        
        setHtmlFile(htmlFiles[0]);
        setInitState("ready");
      })
      .catch((err: Error) => {
        setInitError(err.message);
        setInitState("error");
      });
  }, [initialFileIds.join(',')]);

  const updateSettings = useCallback(<K extends keyof SplitHtmlSettings>(key: K, value: SplitHtmlSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const splitAction = useAsyncAction<SplitResult>(
    async () => {
      if (!htmlFile) throw new Error("No HTML file selected");
      const res = await splitHtmlToChapters(htmlFile.id, {
        excludeToc: settings.excludeToc,
        outputFormat: settings.outputFormat,
      });
      if (!res.success) throw new Error("Failed to split HTML");
      return res;
    },
    {
      loading: "Splitting HTML into chapters...",
      success: (res) => `Split into ${res.chapterCount} chapters!`,
      error: (err) => err.message || "Failed to split HTML",
    }
  );

  const split = useCallback(async () => {
    if (!htmlFile) return;
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
  }, [htmlFile, splitAction.execute]);

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
    htmlFile,
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
