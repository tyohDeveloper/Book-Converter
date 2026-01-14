import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "./useAsyncAction";
import { defaultTypographySettings } from "@shared/contracts/settings";
import { listFiles } from "@/lib/file-manager/list-files";
import { convertToHtml } from "@/lib/file-manager/convert-to-html";
import { downloadFile } from "@/lib/file-manager/download-file";
import type { ManagedFile, BookStylePreset } from "@/lib/file-manager/types";

export type ConvertState = "loading" | "ready" | "converting" | "complete" | "error";
export type HtmlOutputFormat = "individual";

export interface HtmlConversionSettings {
  mergeParagraphs: boolean;
  removePageNumbers: boolean;
  fixHyphenation: boolean;
  removeHeadersFooters: boolean;
  cleanWhitespace: boolean;
  fixLigatures: boolean;
  sensitivity: number;
  title: string;
  detectCodeBlocks: boolean;
  convertFootnotes: boolean;
  preserveTOCIndentation: boolean;
  preserveIndex: boolean;
  detectTables: boolean;
  includeTableOfContents: boolean;
  simpleExtraction: boolean;
  outputFormat: HtmlOutputFormat;
  skipCss: boolean;
  preserveStyles: boolean;
  typography: typeof defaultTypographySettings;
  bookStylePreset?: BookStylePreset;
}

export const defaultHtmlSettings: HtmlConversionSettings = {
  mergeParagraphs: true,
  removePageNumbers: true,
  fixHyphenation: true,
  removeHeadersFooters: true,
  cleanWhitespace: true,
  fixLigatures: true,
  sensitivity: 50,
  title: "Converted Document",
  detectCodeBlocks: true,
  convertFootnotes: true,
  preserveTOCIndentation: true,
  preserveIndex: true,
  detectTables: true,
  includeTableOfContents: true,
  simpleExtraction: false,
  outputFormat: "individual",
  skipCss: false,
  preserveStyles: true,
  typography: { ...defaultTypographySettings },
};

export interface OutputFile {
  id: string;
  name: string;
  size: number;
}

export interface UseHtmlConversionOptions {
  initialFileIds?: string[];
}

interface ConversionResult {
  file?: OutputFile;
  files?: OutputFile[];
}

export function useHtmlConversion(options: UseHtmlConversionOptions = {}) {
  const { initialFileIds = [] } = options;
  
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFile | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [settings, setSettings] = useState<HtmlConversionSettings>(defaultHtmlSettings);

  const updateSettings = useCallback(<K extends keyof HtmlConversionSettings>(
    key: K,
    value: HtmlConversionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateTypography = useCallback(<K extends keyof typeof defaultTypographySettings>(
    key: K,
    value: (typeof defaultTypographySettings)[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value }
    }));
  }, []);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const allFiles = await listFiles();
        const pdfFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.pdf') && !f.isOutput);
        const matchedFiles = initialFileIds.length > 0
          ? allFiles.filter(f => initialFileIds.includes(f.id))
          : pdfFiles;

        if (matchedFiles.length === 0) {
          setInitState("error");
          setInitError("No files found. Please upload PDF files from the home page.");
          return;
        }

        setFiles(matchedFiles);
        const firstName = matchedFiles[0].name.replace(/\.pdf$/i, '');
        updateSettings('title', firstName);
        setInitState("ready");
      } catch (e: unknown) {
        setInitState("error");
        setInitError(e instanceof Error ? e.message : "Failed to load files");
      }
    };

    loadFiles();
  }, [initialFileIds.join(',')]);

  const convertAction = useAsyncAction<ConversionResult>(
    async (signal) => {
      const sortedFileIds = files.map(f => f.id);
      return await convertToHtml(sortedFileIds, settings, signal);
    },
    {
      loading: "Converting to HTML...",
      success: (res) => res.files 
        ? `Created ${res.files.length} XHTML files!`
        : "HTML created successfully!",
      error: (err) => err.name === "AbortError" ? null : err.message || "Conversion failed",
      cancelled: "Conversion cancelled",
    }
  );

  const convert = useCallback(async () => {
    const result = await convertAction.execute();
    if (result) {
      if (result.files) {
        setOutputFiles(result.files);
        setOutputFile(null);
      } else if (result.file) {
        setOutputFile(result.file);
        setOutputFiles([]);
      }
    }
  }, [convertAction.execute]);

  const download = useCallback(async () => {
    if (!outputFile) return;
    await downloadFile(outputFile.id);
    toast.success("Download started!");
  }, [outputFile]);

  const downloadSingle = useCallback(async (fileId: string) => {
    await downloadFile(fileId);
    toast.success("Download started!");
  }, []);

  const downloadAll = useCallback(async () => {
    if (outputFiles.length === 0) return;
    for (const file of outputFiles) {
      await downloadFile(file.id);
    }
    toast.success(`Downloaded ${outputFiles.length} files`);
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
    updateTypography,
    convert,
    download,
    downloadSingle,
    downloadAll,
    cancel: convertAction.cancel,
  };
}
