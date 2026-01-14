import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "./useAsyncAction";
import { listFiles } from "@/lib/file-manager/list-files";
import { convertToEpub } from "@/lib/file-manager/convert-to-epub";
import { downloadFile } from "@/lib/file-manager/download-file";
import type { ManagedFile, EpubSettings } from "@/lib/file-manager/types";

type ConvertState = "loading" | "ready" | "converting" | "error";

export interface UseEpubConversionOptions {
  initialFileIds: string[];
}

export interface UseEpubConversionResult {
  htmlFile: ManagedFile | null;
  state: ConvertState;
  error: string | null;
  settings: EpubSettings;
  updateSettings: (updates: Partial<EpubSettings>) => void;
  handleConvert: () => Promise<void>;
  cancelConversion: () => void;
}

function isHtmlFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.xhtml');
}

export function useEpubConversion({ initialFileIds }: UseEpubConversionOptions): UseEpubConversionResult {
  const [htmlFile, setHtmlFile] = useState<ManagedFile | null>(null);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [settings, setSettings] = useState<EpubSettings>({
    title: "Generated eBook",
    author: "Unknown",
    compressionLevel: "maximum",
  });

  useEffect(() => {
    const loadFile = async () => {
      try {
        const allFiles = await listFiles();

        if (initialFileIds.length > 0) {
          const selectedFiles = allFiles.filter(f => initialFileIds.includes(f.id));
          const htmlFiles = selectedFiles.filter(f => isHtmlFile(f.name));
          if (htmlFiles.length > 0) {
            const file = htmlFiles[0];
            setHtmlFile(file);
            setSettings(prev => ({
              ...prev,
              title: file.name.replace(/\.(html|htm|xhtml)$/i, '').replace(/-\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}$/i, ''),
            }));
            setInitState("ready");
            return;
          }
        }

        const htmlFiles = allFiles.filter(f => isHtmlFile(f.name));
        if (htmlFiles.length === 0) {
          setInitState("error");
          setInitError("No HTML files found. Please convert a PDF to HTML first using the HTML converter.");
          return;
        }

        const file = htmlFiles[0];
        setHtmlFile(file);
        setSettings(prev => ({
          ...prev,
          title: file.name.replace(/\.(html|htm|xhtml)$/i, '').replace(/-\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}$/i, ''),
        }));
        setInitState("ready");
      } catch (err: unknown) {
        setInitState("error");
        setInitError(err instanceof Error ? err.message : "Failed to load files");
      }
    };

    loadFile();
  }, [initialFileIds.join(',')]);

  const updateSettings = useCallback((updates: Partial<EpubSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const convertAction = useAsyncAction<{ file?: { id: string } }>(
    async (signal) => {
      if (!htmlFile) throw new Error("No HTML file selected");
      const result = await convertToEpub(htmlFile.id, settings, signal);
      if (result.file) {
        await downloadFile(result.file.id);
      }
      return result;
    },
    {
      loading: "Generating EPUB...",
      success: "EPUB created and downloaded!",
      error: (err) => err.name === "AbortError" ? null : err.message || "Failed to generate EPUB",
      cancelled: "Conversion cancelled",
    }
  );

  const handleConvert = useCallback(async () => {
    if (!htmlFile) {
      toast.error("No HTML file selected");
      return;
    }
    await convertAction.execute();
  }, [htmlFile, convertAction.execute]);

  const state: ConvertState = initState === "loading" ? "loading"
    : initState === "error" ? "error"
    : convertAction.state === "loading" ? "converting"
    : "ready";

  const error = initError || convertAction.error;

  return {
    htmlFile,
    state,
    error,
    settings,
    updateSettings,
    handleConvert,
    cancelConversion: convertAction.cancel,
  };
}
