import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { withAsyncToast } from "@/lib/async-toast";
import { listFiles } from "@/lib/file-manager/list-files";
import { bundleHtmlFiles } from "@/lib/file-manager/epub";
import { downloadFile } from "@/lib/file-manager/download-file";
import { isHtmlFile } from "@/lib/file-manager/utils";
import type { ManagedFile, OutputFileResult } from "@/lib/file-manager/types";

type ConversionState = "loading" | "ready" | "converting" | "complete" | "error";

export interface BundleHtmlSettings {
  title: string;
  includeTableOfContents: boolean;
  skipCss: boolean;
}

export interface UseBundleHtmlOptions {
  initialFileIds: string[];
}

export interface UseBundleHtmlResult {
  files: ManagedFile[];
  state: ConversionState;
  error: string | null;
  outputFile: OutputFileResult | null;
  settings: BundleHtmlSettings;
  updateSettings: <K extends keyof BundleHtmlSettings>(key: K, value: BundleHtmlSettings[K]) => void;
  convert: () => Promise<void>;
  download: () => void;
  totalSize: number;
}

export function useBundleHtml({ initialFileIds }: UseBundleHtmlOptions): UseBundleHtmlResult {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [state, setState] = useState<ConversionState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFileResult | null>(null);
  const [settings, setSettings] = useState<BundleHtmlSettings>({
    title: "",
    includeTableOfContents: true,
    skipCss: false,
  });

  useEffect(() => {
    if (initialFileIds.length === 0) {
      setError("No files selected");
      setState("error");
      return;
    }

    listFiles()
      .then((allFiles: ManagedFile[]) => {
        const selectedFiles = allFiles.filter(f => 
          initialFileIds.includes(f.id) && isHtmlFile(f.name)
        );
        
        if (selectedFiles.length === 0) {
          setError("No valid HTML/XHTML files found");
          setState("error");
          return;
        }
        
        setFiles(selectedFiles);
        const defaultTitle = selectedFiles.length === 1 
          ? selectedFiles[0].name.replace(/\.(x?html?)$/i, '')
          : "Bundled Documents";
        setSettings(prev => ({ ...prev, title: defaultTitle }));
        setState("ready");
      })
      .catch((err: Error) => {
        setError(err.message);
        setState("error");
      });
  }, [initialFileIds.join(',')]);

  const updateSettings = useCallback(<K extends keyof BundleHtmlSettings>(key: K, value: BundleHtmlSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const convert = useCallback(async () => {
    if (files.length === 0) return;
    
    setState("converting");
    setError(null);

    try {
      const fileIds = files.map(f => f.id);
      const result = await withAsyncToast(
        async () => {
          const res = await bundleHtmlFiles(fileIds, {
            title: settings.title || undefined,
            includeTableOfContents: settings.includeTableOfContents,
            skipCss: settings.skipCss,
          });
          if (!res.success || !res.file) throw new Error("Bundling failed");
          return res;
        },
        {
          loading: "Bundling HTML files...",
          success: "HTML files bundled successfully!",
          error: (err) => err.message || "Bundling failed"
        }
      );

      setOutputFile(result.file);
      setState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bundling failed");
      setState("ready");
    }
  }, [files, settings]);

  const download = useCallback(() => {
    if (outputFile) {
      downloadFile(outputFile.id);
    }
  }, [outputFile]);

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
