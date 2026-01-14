import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { listFiles } from "@/lib/file-manager/list-files";
import { convertEpubToHtml } from "@/lib/file-manager/epub";
import { downloadFile } from "@/lib/file-manager/download-file";
import { isEpubFile } from "@/lib/file-manager/utils";
import type { ManagedFile, OutputFileResult } from "@/lib/file-manager/types";

type ConversionState = "loading" | "ready" | "converting" | "complete" | "error";

export interface EpubToHtmlSettings {
  title: string;
  includeTableOfContents: boolean;
  skipCss: boolean;
}

export interface UseEpubToHtmlConversionOptions {
  initialFileIds: string[];
}

export interface UseEpubToHtmlConversionResult {
  files: ManagedFile[];
  state: ConversionState;
  error: string | null;
  outputFile: OutputFileResult | null;
  settings: EpubToHtmlSettings;
  updateSettings: <K extends keyof EpubToHtmlSettings>(key: K, value: EpubToHtmlSettings[K]) => void;
  convert: () => Promise<void>;
  download: () => void;
  totalSize: number;
}

interface ConversionResult {
  success: boolean;
  file?: OutputFileResult;
}

export function useEpubToHtmlConversion({ initialFileIds }: UseEpubToHtmlConversionOptions): UseEpubToHtmlConversionResult {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFileResult | null>(null);
  const [settings, setSettings] = useState<EpubToHtmlSettings>({
    title: "",
    includeTableOfContents: true,
    skipCss: false,
  });

  useEffect(() => {
    if (initialFileIds.length === 0) {
      setInitError("No files selected");
      setInitState("error");
      return;
    }

    listFiles()
      .then((allFiles: ManagedFile[]) => {
        const selectedFiles = allFiles.filter(f => 
          initialFileIds.includes(f.id) && isEpubFile(f.name)
        );
        
        if (selectedFiles.length === 0) {
          setInitError("No valid EPUB files found");
          setInitState("error");
          return;
        }
        
        setFiles(selectedFiles);
        const defaultTitle = selectedFiles.length === 1 
          ? selectedFiles[0].name.replace(/\.epub$/i, '')
          : "Combined Documents";
        setSettings(prev => ({ ...prev, title: defaultTitle }));
        setInitState("ready");
      })
      .catch((err: Error) => {
        setInitError(err.message);
        setInitState("error");
      });
  }, [initialFileIds.join(',')]);

  const updateSettings = useCallback(<K extends keyof EpubToHtmlSettings>(key: K, value: EpubToHtmlSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const convertAction = useAsyncAction<ConversionResult>(
    async () => {
      const fileIds = files.map(f => f.id);
      const res = await convertEpubToHtml(fileIds, {
        title: settings.title || undefined,
        includeTableOfContents: settings.includeTableOfContents,
        skipCss: settings.skipCss,
      });
      if (!res.success || !res.file) throw new Error("Conversion failed");
      return res;
    },
    {
      loading: "Converting EPUB to HTML...",
      success: "EPUB converted to HTML successfully!",
      error: (err) => err.message || "Conversion failed",
    }
  );

  const convert = useCallback(async () => {
    if (files.length === 0) return;
    const result = await convertAction.execute();
    if (result?.file) {
      setOutputFile(result.file);
    }
  }, [files, convertAction.execute]);

  const download = useCallback(() => {
    if (outputFile) {
      downloadFile(outputFile.id);
    }
  }, [outputFile]);

  const state: ConversionState = initState === "loading" ? "loading"
    : initState === "error" ? "error"
    : convertAction.state === "loading" ? "converting"
    : convertAction.state === "complete" ? "complete"
    : convertAction.state === "error" ? "error"
    : "ready";

  const error = initError || convertAction.error;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return {
    files,
    state,
    error,
    outputFile,
    settings,
    updateSettings,
    convert,
    download,
    totalSize,
  };
}
