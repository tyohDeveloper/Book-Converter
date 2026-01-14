import { useState, useEffect, useCallback } from "react";
import { withAsyncToast } from "@/lib/async-toast";
import { listFiles } from "@/lib/file-manager/list-files";
import { getHtmlElements, formatHtmlElements, type HtmlElement, type ElementOperation, type ElementTag, type WrapKind } from "@/lib/file-manager/elements-api";
import { downloadFile } from "@/lib/file-manager/download-file";
import { isHtmlFile } from "@/lib/file-manager/utils";
import type { ManagedFile } from "@/lib/file-manager/types";

export type FormatState = "loading" | "ready" | "applying" | "complete" | "error";

export interface OutputFileResult {
  id: string;
  name: string;
  size: number;
}

export interface UseHtmlFormatOptions {
  initialFileId?: string;
}

export function useHtmlFormat(options: UseHtmlFormatOptions = {}) {
  const { initialFileId } = options;
  
  const [file, setFile] = useState<ManagedFile | null>(null);
  const [elements, setElements] = useState<HtmlElement[]>([]);
  const [state, setState] = useState<FormatState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const loadElements = useCallback(async (fileId: string) => {
    try {
      const result = await getHtmlElements(fileId);
      setElements(result.elements);
      return result.elements;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    const loadFile = async () => {
      if (!initialFileId) {
        setError("No file selected");
        setState("error");
        return;
      }

      try {
        const allFiles = await listFiles();
        const selectedFile = allFiles.find(f => f.id === initialFileId);
        
        if (!selectedFile || !isHtmlFile(selectedFile.name)) {
          setError("Invalid HTML file selected");
          setState("error");
          return;
        }
        
        setFile(selectedFile);
        await loadElements(initialFileId);
        setState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
        setState("error");
      }
    };

    loadFile();
  }, [initialFileId, loadElements]);

  const startEditing = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const applyOperation = useCallback(async (operation: ElementOperation, exitAfter: boolean = false) => {
    if (!file) return;
    
    setState("applying");
    setError(null);

    try {
      const result = await withAsyncToast(
        async () => {
          const res = await formatHtmlElements(file.id, [operation]);
          if (!res.success) throw new Error("Operation failed");
          return res;
        },
        {
          loading: "Applying...",
          success: "Done!",
          error: (err) => err.message || "Failed"
        }
      );

      if (result.file) {
        setFile({
          id: result.file.id,
          name: result.file.name,
          size: result.file.size,
          uploadedAt: Date.now(),
          isOutput: result.file.isOutput ?? true,
          outputType: 'html' as const,
        });
        const newElements = await loadElements(result.file.id);
        
        if (exitAfter) {
          setEditingIndex(null);
        } else if (editingIndex !== null) {
          const stillExists = newElements.find(e => e.index === editingIndex);
          if (!stillExists) {
            setEditingIndex(null);
          }
        }
      }
      setState("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to apply change";
      setError(message);
      setState("ready");
    }
  }, [file, loadElements, editingIndex]);

  const changeTag = useCallback(async (index: number, newTag: ElementTag) => {
    await applyOperation({ index, action: "changeTag", newTag }, false);
  }, [applyOperation]);

  const addStyle = useCallback(async (index: number, style: string) => {
    if (!style.trim()) return;
    await applyOperation({ index, action: "addStyle", style: style.trim() }, false);
  }, [applyOperation]);

  const deleteElement = useCallback(async (index: number) => {
    await applyOperation({ index, action: "delete" }, true);
  }, [applyOperation]);

  const splitAtPosition = useCallback(async (index: number, position: number) => {
    if (position <= 0) return;
    await applyOperation({ index, action: "split", position }, true);
  }, [applyOperation]);

  const insertBreakAtPosition = useCallback(async (index: number, position: number) => {
    if (position <= 0) return;
    await applyOperation({ index, action: "insertBreak", position }, false);
  }, [applyOperation]);

  const mergeWithPrevious = useCallback(async (index: number) => {
    await applyOperation({ index, action: "mergeWithPrevious" }, true);
  }, [applyOperation]);

  const wrapSelection = useCallback(async (index: number, start: number, end: number, wrapKind: WrapKind, wrapStyle?: string) => {
    if (start >= end) return;
    await applyOperation({ 
      index, 
      action: "wrap", 
      range: { start, end }, 
      wrapKind, 
      wrapStyle 
    }, false);
  }, [applyOperation]);

  const updateContent = useCallback(async (index: number, content: string) => {
    await applyOperation({ index, action: "updateContent", content }, true);
  }, [applyOperation]);

  const insertAfter = useCallback(async (index: number, tag: ElementTag, content: string) => {
    await applyOperation({ index, action: "insertAfter", insertTag: tag, insertContent: content }, true);
  }, [applyOperation]);

  const canMergeWithPrevious = useCallback((index: number) => {
    return index > 0;
  }, []);

  const getEditingElement = useCallback(() => {
    if (editingIndex === null) return null;
    return elements.find(e => e.index === editingIndex) || null;
  }, [editingIndex, elements]);

  const markComplete = useCallback(() => {
    if (file) {
      setState("complete");
    }
  }, [file]);

  const download = useCallback(async () => {
    if (!file) return;
    await withAsyncToast(
      () => downloadFile(file.id),
      { loading: "Starting download...", success: "Download started!", error: "Failed to download" }
    );
  }, [file]);

  const editingElement = getEditingElement();

  return {
    file,
    elements,
    editingIndex,
    editingElement,
    state,
    error,
    startEditing,
    stopEditing,
    changeTag,
    addStyle,
    deleteElement,
    splitAtPosition,
    insertBreakAtPosition,
    mergeWithPrevious,
    wrapSelection,
    updateContent,
    insertAfter,
    canMergeWithPrevious,
    markComplete,
    download,
  };
}
