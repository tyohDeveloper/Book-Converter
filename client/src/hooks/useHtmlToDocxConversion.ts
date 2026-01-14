import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { listFiles } from "@/lib/file-manager/list-files";
import { convertHtmlToDocx } from "@/lib/file-manager/html-to-docx";
import { downloadFile } from "@/lib/file-manager/download-file";
import { downloadSelectedFiles } from "@/lib/file-manager/download-selected-files";
import { isHtmlFile } from "@/lib/file-manager/utils";
import type { ManagedFile, OutputFileResult } from "@/lib/file-manager/types";

export type ConvertState = "loading" | "ready" | "converting" | "complete" | "error";
export type ConversionMode = "combine" | "batch";

export interface HtmlToDocxSettings {
  title: string;
  author: string;
  mode: ConversionMode;
}

export const defaultHtmlToDocxSettings: HtmlToDocxSettings = {
  title: "",
  author: "",
  mode: "combine",
};

export interface UseHtmlToDocxConversionOptions {
  initialFileIds?: string[];
}

interface ConversionResult {
  success: boolean;
  file?: OutputFileResult;
  files?: OutputFileResult[];
}

export function useHtmlToDocxConversion(options: UseHtmlToDocxConversionOptions = {}) {
  const { initialFileIds = [] } = options;
  
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFileResult | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFileResult[]>([]);
  const [settings, setSettings] = useState<HtmlToDocxSettings>(defaultHtmlToDocxSettings);

  const updateSettings = useCallback(<K extends keyof HtmlToDocxSettings>(
    key: K,
    value: HtmlToDocxSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const loadFiles = async () => {
      if (initialFileIds.length === 0) {
        setInitError("No files selected");
        setInitState("error");
        return;
      }

      try {
        const allFiles = await listFiles();
        const selectedFiles = allFiles.filter(f => initialFileIds.includes(f.id));
        const htmlFiles = selectedFiles.filter(f => isHtmlFile(f.name));
        
        if (htmlFiles.length === 0) {
          setInitError("No HTML files found. Please select at least one HTML file.");
          setInitState("error");
          return;
        }
        
        setFiles(htmlFiles);
        const firstName = htmlFiles[0].name.replace(/\.(html?|xhtml)$/i, '');
        const defaultTitle = htmlFiles.length > 1 ? "Combined Documents" : firstName;
        setSettings(prev => ({ ...prev, title: defaultTitle }));
        setInitState("ready");
      } catch (err) {
        setInitError(err instanceof Error ? err.message : "Failed to load files");
        setInitState("error");
      }
    };

    loadFiles();
  }, [initialFileIds.join(',')]);

  const convertAction = useAsyncAction<ConversionResult>(
    async () => {
      const fileIds = files.map(f => f.id);
      const res = await convertHtmlToDocx(fileIds, {
        title: settings.mode === 'combine' ? (settings.title || undefined) : undefined,
        author: settings.author || undefined,
        mode: settings.mode,
      });
      if (!res.success) throw new Error("Conversion failed");
      return res;
    },
    {
      loading: "Converting to DOCX...",
      success: (res) => settings.mode === 'batch' && res.files 
        ? `Created ${res.files.length} DOCX files!` 
        : "DOCX created successfully!",
      error: (err) => err.message || "Conversion failed",
    }
  );

  const convert = useCallback(async () => {
    if (files.length === 0) return;
    const result = await convertAction.execute();
    if (result) {
      if (settings.mode === 'batch' && result.files) {
        setOutputFiles(result.files);
      } else if (result.file) {
        setOutputFile(result.file);
      }
    }
  }, [files, settings.mode, convertAction.execute]);

  const download = useCallback(async () => {
    if (!outputFile) return;
    await downloadFile(outputFile.id);
  }, [outputFile]);

  const downloadAll = useCallback(async () => {
    if (outputFiles.length === 0) return;
    await downloadSelectedFiles(outputFiles.map(f => f.id), { stripTimestamps: true });
  }, [outputFiles]);

  const state: ConvertState = initState === "loading" ? "loading"
    : initState === "error" ? "error"
    : convertAction.state === "loading" ? "converting"
    : convertAction.state === "complete" ? "complete"
    : convertAction.state === "error" ? "error"
    : "ready";

  const error = initError || convertAction.error;

  return {
    files,
    state,
    error,
    outputFile,
    outputFiles,
    settings,
    updateSettings,
    convert,
    download,
    downloadAll,
  };
}
