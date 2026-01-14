import { useState, useCallback, useRef } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { getHeaders } from "@/lib/session";

export interface PastedFile {
  id: string;
  name: string;
  preview: string;
  createdAt: Date;
}

type PasteState = "ready" | "processing" | "error";

export interface PasteOptions {
  skipCss?: boolean;
}

export interface UseClipboardPasteResult {
  state: PasteState;
  error: string | null;
  files: PastedFile[];
  currentPreview: string | null;
  pasteFromClipboard: (options?: PasteOptions) => Promise<void>;
  clearPreview: () => void;
  removeFile: (id: string) => void;
  clearAll: () => void;
}

interface PasteResult {
  file: { id: string; name: string };
  preview?: string;
}

export function useClipboardPaste(): UseClipboardPasteResult {
  const [files, setFiles] = useState<PastedFile[]>([]);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const optionsRef = useRef<PasteOptions>({});

  const pasteAction = useAsyncAction<PasteResult>(
    async () => {
      const clipboardItems = await navigator.clipboard.read();
      let htmlContent: string | null = null;
      let textContent: string | null = null;

      for (const item of clipboardItems) {
        if (item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          htmlContent = await blob.text();
        }
        if (item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          textContent = await blob.text();
        }
      }

      if (!htmlContent && !textContent) {
        throw new Error("No HTML or text content found in clipboard");
      }

      const response = await fetch("/api/files/from-html", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          html: htmlContent || null,
          text: textContent || null,
          skipCss: optionsRef.current.skipCss,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create file");
      }

      return response.json();
    },
    {
      loading: "Creating XHTML file...",
      success: (data) => `Created ${data.file.name}`,
      error: (err) => {
        if (err.name === "NotAllowedError") {
          return "Clipboard access denied. Please allow clipboard permissions.";
        }
        return err.message || "Failed to create file";
      },
    }
  );

  const pasteFromClipboard = useCallback(async (options: PasteOptions = {}) => {
    optionsRef.current = options;
    setCurrentPreview(null);
    
    const result = await pasteAction.execute();
    if (result) {
      const newFile: PastedFile = {
        id: result.file.id,
        name: result.file.name,
        preview: result.preview || "",
        createdAt: new Date(),
      };
      setFiles(prev => [newFile, ...prev]);
      setCurrentPreview(result.preview || null);
    }
  }, [pasteAction.execute]);

  const clearPreview = useCallback(() => {
    setCurrentPreview(null);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setCurrentPreview(null);
    pasteAction.reset();
  }, [pasteAction.reset]);

  const state: PasteState = pasteAction.state === "loading" ? "processing"
    : pasteAction.state === "error" ? "error"
    : "ready";

  return {
    state,
    error: pasteAction.error,
    files,
    currentPreview,
    pasteFromClipboard,
    clearPreview,
    removeFile,
    clearAll,
  };
}
