import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { withAsyncToast } from "@/lib/async-toast";
import { listFiles } from "@/lib/file-manager/list-files";
import { convertDocx } from "@/lib/file-manager/docx";
import { downloadFile } from "@/lib/file-manager/download-file";
import type { ManagedFile, OutputFileResult } from "@/lib/file-manager/types";

export type ConvertState = "loading" | "ready" | "converting" | "complete" | "error";
export type OutputFormat = "html" | "epub" | "pdf";

export interface DocxConversionSettings {
  title: string;
  author: string;
  includeTableOfContents: boolean;
  outputFormat: OutputFormat;
}

export const defaultDocxSettings: DocxConversionSettings = {
  title: "",
  author: "",
  includeTableOfContents: true,
  outputFormat: "html",
};

export interface UseDocxConversionOptions {
  initialFileIds?: string[];
}

export function useDocxConversion(options: UseDocxConversionOptions = {}) {
  const { initialFileIds = [] } = options;
  
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [state, setState] = useState<ConvertState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFileResult | null>(null);
  const [settings, setSettings] = useState<DocxConversionSettings>(defaultDocxSettings);

  const updateSettings = useCallback(<K extends keyof DocxConversionSettings>(
    key: K,
    value: DocxConversionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const loadFiles = async () => {
      if (initialFileIds.length === 0) {
        setError("No files selected");
        setState("error");
        return;
      }

      try {
        const allFiles = await listFiles();
        const selectedFiles = allFiles.filter(f => 
          initialFileIds.includes(f.id) && f.name.toLowerCase().endsWith('.docx')
        );
        
        if (selectedFiles.length === 0) {
          setError("No valid DOCX files found");
          setState("error");
          return;
        }
        
        setFiles(selectedFiles);
        const defaultTitle = selectedFiles.length === 1 
          ? selectedFiles[0].name.replace(/\.docx$/i, '')
          : "Combined Documents";
        setSettings(prev => ({ ...prev, title: defaultTitle }));
        setState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load files");
        setState("error");
      }
    };

    loadFiles();
  }, [initialFileIds.join(',')]);

  const convert = useCallback(async () => {
    if (files.length === 0) return;
    
    if (settings.outputFormat === 'pdf' && files.length > 1) {
      setError("PDF conversion only supports a single file. Use HTML or EPUB for multiple files.");
      toast.error("PDF conversion only supports a single file");
      return;
    }
    
    setState("converting");
    setError(null);

    try {
      const fileIds = files.map(f => f.id);
      const result = await withAsyncToast(
        async () => {
          const res = await convertDocx(fileIds, settings.outputFormat, {
            title: settings.title || undefined,
            author: settings.author || undefined,
            includeTableOfContents: settings.includeTableOfContents,
          });
          if (!res.success || !res.file) throw new Error("Conversion failed");
          return res;
        },
        {
          loading: `Converting to ${settings.outputFormat.toUpperCase()}...`,
          success: `${settings.outputFormat.toUpperCase()} created successfully!`,
          error: (err) => err.message || "Conversion failed"
        }
      );

      setOutputFile(result.file);
      setState("complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      setError(message);
      setState("ready");
    }
  }, [files, settings]);

  const download = useCallback(async () => {
    if (!outputFile) return;
    await withAsyncToast(
      () => downloadFile(outputFile.id),
      { loading: "Starting download...", success: "Download started!", error: "Failed to download" }
    );
  }, [outputFile]);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const canView = settings.outputFormat === 'html' || settings.outputFormat === 'pdf';

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
    canView,
  };
}
