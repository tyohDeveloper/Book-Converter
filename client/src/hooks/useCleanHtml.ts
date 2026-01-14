import { useState, useEffect, useCallback } from "react";
import { withAsyncToast } from "@/lib/async-toast";
import { listFiles } from "@/lib/file-manager/list-files";
import { cleanHtml, type CleanHtmlSettings, type CleanHtmlStats } from "@/lib/file-manager/clean-html";
import { isHtmlFile } from "@/lib/file-manager/utils";
import type { ManagedFile, OutputFileResult } from "@/lib/file-manager/types";

type CleanState = "loading" | "ready" | "cleaning" | "complete" | "error";

export interface UseCleanHtmlOptions {
  initialFileIds: string[];
}

export interface UseCleanHtmlResult {
  htmlFile: ManagedFile | null;
  state: CleanState;
  error: string | null;
  outputFile: OutputFileResult | null;
  stats: CleanHtmlStats | null;
  settings: CleanHtmlSettings;
  updateSettings: <K extends keyof CleanHtmlSettings>(key: K, value: CleanHtmlSettings[K]) => void;
  clean: () => Promise<void>;
}

export function useCleanHtml({ initialFileIds }: UseCleanHtmlOptions): UseCleanHtmlResult {
  const [htmlFile, setHtmlFile] = useState<ManagedFile | null>(null);
  const [state, setState] = useState<CleanState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<OutputFileResult | null>(null);
  const [stats, setStats] = useState<CleanHtmlStats | null>(null);
  const [settings, setSettings] = useState<CleanHtmlSettings>({
    removeNullSpans: true,
    removeWhitespaceStyles: true,
    removeInterparagraphBr: true,
    flattenNestedElements: true,
    removeUndefinedClasses: true,
  });

  useEffect(() => {
    if (initialFileIds.length === 0) {
      setError("No files selected");
      setState("error");
      return;
    }

    listFiles()
      .then((allFiles: ManagedFile[]) => {
        const selectedFiles = allFiles.filter(f => initialFileIds.includes(f.id));
        const htmlFiles = selectedFiles.filter(f => isHtmlFile(f.name));
        
        if (htmlFiles.length === 0) {
          setError("No HTML/XHTML file found. Please select one HTML file.");
          setState("error");
          return;
        }
        
        if (htmlFiles.length > 1) {
          setError("Please select only one HTML file to clean.");
          setState("error");
          return;
        }
        
        setHtmlFile(htmlFiles[0]);
        setState("ready");
      })
      .catch((err: Error) => {
        setError(err.message);
        setState("error");
      });
  }, [initialFileIds.join(',')]);

  const updateSettings = useCallback(<K extends keyof CleanHtmlSettings>(key: K, value: CleanHtmlSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const clean = useCallback(async () => {
    if (!htmlFile) return;
    
    setState("cleaning");
    setError(null);

    try {
      const result = await withAsyncToast(
        async () => {
          const res = await cleanHtml(htmlFile.id, settings);
          if (!res.success) throw new Error("Failed to clean HTML");
          return res;
        },
        {
          loading: "Cleaning HTML...",
          success: (res) => {
            const total = res.stats.nullSpansRemoved + 
                         res.stats.whitespaceStylesRemoved + 
                         res.stats.brElementsRemoved + 
                         res.stats.nestedElementsFlattened +
                         res.stats.undefinedClassesRemoved;
            return `Cleaned ${total} items!`;
          },
          error: (err) => err.message || "Failed to clean HTML"
        }
      );

      setOutputFile(result.file);
      setStats(result.stats);
      setState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clean HTML");
      setState("ready");
    }
  }, [htmlFile, settings]);

  return {
    htmlFile,
    state,
    error,
    outputFile,
    stats,
    settings,
    updateSettings,
    clean,
  };
}
