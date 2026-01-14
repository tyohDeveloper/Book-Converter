import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { listFiles } from "@/lib/file-manager/list-files";
import { convertHtmlsToPdf, type HtmlToPdfSettings as ApiSettings, type OutputFile } from "@/lib/file-manager/html-to-pdf";
import { downloadFile } from "@/lib/file-manager/download-file";
import { isHtmlFile } from "@/lib/file-manager/utils";
import type { ManagedFile } from "@/lib/file-manager/types";
import { defaultPdfDesignRules, type PdfDesignRules } from "@shared/contracts/pdf-design-rules";

export type ConvertState = "loading" | "ready" | "converting" | "complete" | "error";

export interface HtmlToPdfSettings {
  title: string;
  paperSize: 'letter' | 'a4';
  landscape: boolean;
  designRules: PdfDesignRules;
}

export const defaultHtmlToPdfSettings: HtmlToPdfSettings = {
  title: "",
  paperSize: "letter",
  landscape: false,
  designRules: defaultPdfDesignRules,
};

export interface UseHtmlToPdfConversionOptions {
  initialFileId?: string;
  initialFileIds?: string[];
}

interface ConversionResult {
  success: boolean;
  file?: OutputFile;
  files?: OutputFile[];
}

export function useHtmlToPdfConversion(options: UseHtmlToPdfConversionOptions = {}) {
  const { initialFileId, initialFileIds } = options;
  
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFile | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [settings, setSettings] = useState<HtmlToPdfSettings>(defaultHtmlToPdfSettings);

  const updateSettings = useCallback(<K extends keyof HtmlToPdfSettings>(
    key: K,
    value: HtmlToPdfSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateDesignRules = useCallback(<K extends keyof PdfDesignRules>(
    key: K,
    value: PdfDesignRules[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      designRules: { ...prev.designRules, [key]: value }
    }));
  }, []);

  useEffect(() => {
    const loadFiles = async () => {
      const fileIds = initialFileIds || (initialFileId ? [initialFileId] : []);
      
      if (fileIds.length === 0) {
        setInitError("No files selected");
        setInitState("error");
        return;
      }

      try {
        const allFiles = await listFiles();
        const selectedFiles = fileIds
          .map(id => allFiles.find(f => f.id === id))
          .filter((f): f is ManagedFile => f !== undefined);
        
        if (selectedFiles.length === 0) {
          setInitError("Files not found");
          setInitState("error");
          return;
        }
        
        const htmlFiles = selectedFiles.filter(f => isHtmlFile(f.name));
        if (htmlFiles.length === 0) {
          setInitError("No HTML files selected");
          setInitState("error");
          return;
        }
        
        setFiles(htmlFiles);
        if (htmlFiles.length === 1) {
          const baseName = htmlFiles[0].name.replace(/\.(html?|xhtml)$/i, '');
          setSettings(prev => ({ ...prev, title: baseName }));
        }
        setInitState("ready");
      } catch (err) {
        setInitError(err instanceof Error ? err.message : "Failed to load files");
        setInitState("error");
      }
    };

    loadFiles();
  }, [initialFileId, initialFileIds]);

  const convertAction = useAsyncAction<ConversionResult>(
    async () => {
      if (files.length === 0) throw new Error("No files selected");
      const apiSettings: ApiSettings = {
        title: settings.title || undefined,
        paperSize: settings.paperSize,
        landscape: settings.landscape,
        designRules: settings.designRules,
      };
      const res = await convertHtmlsToPdf(files.map(f => f.id), apiSettings);
      if (!res.success) throw new Error("Conversion failed");
      return res;
    },
    {
      loading: files.length > 1 ? `Converting ${files.length} files to PDF...` : "Converting to PDF...",
      success: files.length > 1 ? `${files.length} PDFs created successfully!` : "PDF created successfully!",
      error: (err) => err.message || "Conversion failed",
    }
  );

  const convert = useCallback(async () => {
    if (files.length === 0) return;
    const result = await convertAction.execute();
    if (result?.file) {
      setOutputFile(result.file);
      setOutputFiles([]);
    } else if (result?.files) {
      setOutputFiles(result.files);
      setOutputFile(null);
    }
  }, [files, convertAction.execute]);

  const download = useCallback(async () => {
    if (outputFile) {
      await downloadFile(outputFile.id);
    }
  }, [outputFile]);

  const downloadAll = useCallback(async () => {
    for (const file of outputFiles) {
      await downloadFile(file.id);
    }
  }, [outputFiles]);

  const downloadSingle = useCallback(async (fileId: string) => {
    await downloadFile(fileId);
  }, []);

  const state: ConvertState = initState === "loading" ? "loading"
    : initState === "error" ? "error"
    : convertAction.state === "loading" ? "converting"
    : convertAction.state === "complete" ? "complete"
    : convertAction.state === "error" ? "error"
    : "ready";

  const error = initError || convertAction.error;

  const file = files.length === 1 ? files[0] : null;
  const isMultiFile = files.length > 1;

  return {
    file,
    files,
    isMultiFile,
    state,
    error,
    outputFile,
    outputFiles,
    settings,
    updateSettings,
    updateDesignRules,
    convert,
    download,
    downloadAll,
    downloadSingle,
  };
}
