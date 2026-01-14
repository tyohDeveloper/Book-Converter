import { useCallback } from "react";
import { withAsyncToast } from "@/lib/async-toast";
import { getCssStyles } from "@/lib/file-manager/css/get-css-styles";
import { updateCssStyles } from "@/lib/file-manager/css/update-css-styles";
import { simplifyInlineStyles } from "@/lib/file-manager/css/simplify-inline-styles";
import { removeCssClass } from "@/lib/file-manager/css/remove-css-class";
import { removeCssClasses } from "@/lib/file-manager/css/remove-css-classes";
import { addCssRule } from "@/lib/file-manager/css/add-css-rule";
import { replaceCssClass } from "@/lib/file-manager/css/replace-css-class";
import { downloadStylesheet, loadStylesheet, mergeStylesheet } from "@/lib/file-manager/css/download-stylesheet";
import type { InlineStyleInfo, ParsedStylesheet } from "@/lib/file-manager/css/types";
import { downloadFile } from "@/lib/file-manager/download-file";
import type { ManagedFile } from "@/lib/file-manager/types";

export interface StylesApiCallbacks {
  onFileUpdate: (file: ManagedFile) => void;
  onStylesUpdate: (styles: string, inlineStyles: InlineStyleInfo[], parsed?: ParsedStylesheet) => void;
  onStateChange: (state: "loading" | "ready" | "saving" | "error") => void;
  onError: (message: string) => void;
  onSelectorClear: () => void;
}

function toManagedFile(file: { id: string; name: string; size: number; isOutput?: boolean }): ManagedFile {
  return { id: file.id, name: file.name, size: file.size, uploadedAt: Date.now(), isOutput: file.isOutput ?? true, outputType: "html" };
}

async function refreshStyles(fileId: string, onStylesUpdate: StylesApiCallbacks["onStylesUpdate"]) {
  const cssResult = await getCssStyles(fileId);
  onStylesUpdate(cssResult.styles, cssResult.inlineStyles || [], cssResult.parsed);
}

export function useStylesApi(file: ManagedFile | null, styles: string, callbacks: StylesApiCallbacks) {
  const { onFileUpdate, onStylesUpdate, onStateChange, onError, onSelectorClear } = callbacks;

  const handleSave = useCallback(async () => {
    if (!file) return;
    onStateChange("saving");
    try {
      const result = await withAsyncToast(
        () => updateCssStyles(file.id, styles),
        { loading: "Saving styles...", success: "Styles saved!", error: (err) => err.message || "Failed to save" }
      );
      if (result.file) onFileUpdate(toManagedFile(result.file));
      onStateChange("ready");
      return styles;
    } catch { 
      onStateChange("ready"); 
      return null;
    }
  }, [file, styles, onFileUpdate, onStateChange]);

  const handleDownload = useCallback(async () => {
    if (!file) return;
    await withAsyncToast(
      () => downloadFile(file.id), 
      { loading: "Starting download...", success: "Download started!", error: "Failed to download" }
    );
  }, [file]);

  const handleSimplify = useCallback(async () => {
    if (!file) return;
    onStateChange("saving");
    try {
      const result = await withAsyncToast(
        () => simplifyInlineStyles(file.id),
        { loading: "Converting inline styles to CSS classes...", success: "Inline styles converted to CSS classes!", error: "Failed to simplify styles" }
      );
      if (result?.file) {
        onFileUpdate(toManagedFile(result.file));
        await refreshStyles(result.file.id, onStylesUpdate);
      }
      onStateChange("ready");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to simplify styles");
      onStateChange("error");
    }
  }, [file, onFileUpdate, onStylesUpdate, onStateChange, onError]);

  const handleRemoveClass = useCallback(async (className: string) => {
    if (!file) return;
    onStateChange("saving");
    try {
      const result = await withAsyncToast(
        () => removeCssClass(file.id, className),
        { loading: `Removing class "${className}"...`, success: `Class "${className}" removed!`, error: "Failed to remove class" }
      );
      if (result?.file) {
        onFileUpdate(toManagedFile(result.file));
        await refreshStyles(result.file.id, onStylesUpdate);
        onSelectorClear();
      }
      onStateChange("ready");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to remove class");
      onStateChange("error");
    }
  }, [file, onFileUpdate, onStylesUpdate, onStateChange, onError, onSelectorClear]);

  const handleRemoveClasses = useCallback(async (classNames: string[]) => {
    if (!file || classNames.length === 0) return;
    onStateChange("saving");
    try {
      const result = await withAsyncToast(
        () => removeCssClasses(file.id, classNames),
        { loading: `Removing ${classNames.length} classes...`, success: `${classNames.length} classes removed!`, error: "Failed to remove classes" }
      );
      if (result?.file) {
        onFileUpdate(toManagedFile(result.file));
        await refreshStyles(result.file.id, onStylesUpdate);
        onSelectorClear();
      }
      onStateChange("ready");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to remove classes");
      onStateChange("error");
    }
  }, [file, onFileUpdate, onStylesUpdate, onStateChange, onError, onSelectorClear]);

  const handleDownloadStylesheet = useCallback(async (filename: string) => {
    if (!file) return;
    await withAsyncToast(
      () => downloadStylesheet(file.id, filename),
      { loading: "Downloading stylesheet...", success: "Stylesheet downloaded!", error: "Failed to download" }
    );
  }, [file]);

  const handleLoadStylesheet = useCallback(async (cssFileId: string): Promise<string | null> => {
    if (!file) return null;
    try {
      const content = await withAsyncToast(
        () => loadStylesheet(cssFileId),
        { loading: "Loading stylesheet...", success: "Stylesheet loaded!", error: "Failed to load" }
      );
      return content;
    } catch {
      return null;
    }
  }, [file]);

  const handleMergeStylesheet = useCallback(async (cssFileId: string): Promise<string | null> => {
    if (!file) return null;
    try {
      const result = await withAsyncToast(
        () => mergeStylesheet(file.id, cssFileId),
        { loading: "Merging stylesheets...", success: "Stylesheets merged!", error: "Failed to merge" }
      );
      return result.styles;
    } catch {
      return null;
    }
  }, [file]);

  const handleAddRule = useCallback(async (selector: string) => {
    if (!file) return;
    onStateChange("saving");
    try {
      const result = await withAsyncToast(
        () => addCssRule(file.id, selector),
        { loading: `Adding rule "${selector}"...`, success: `Rule "${selector}" added!`, error: (err) => err.message }
      );
      if (result?.file) {
        onFileUpdate(toManagedFile(result.file));
        await refreshStyles(result.file.id, onStylesUpdate);
      }
      onStateChange("ready");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add rule");
      onStateChange("ready");
    }
  }, [file, onFileUpdate, onStylesUpdate, onStateChange, onError]);

  const handleReplaceClass = useCallback(async (sourceClass: string, targetClass: string) => {
    if (!file) return;
    onStateChange("saving");
    try {
      const result = await withAsyncToast(
        () => replaceCssClass(file.id, sourceClass, targetClass),
        { loading: `Replacing ${sourceClass} with ${targetClass}...`, success: `Class replaced!`, error: (err) => err.message }
      );
      if (result?.file) {
        onFileUpdate(toManagedFile(result.file));
        await refreshStyles(result.file.id, onStylesUpdate);
        onSelectorClear();
      }
      onStateChange("ready");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to replace class");
      onStateChange("ready");
    }
  }, [file, onFileUpdate, onStylesUpdate, onStateChange, onError, onSelectorClear]);

  return {
    handleSave, handleDownload, handleSimplify, handleRemoveClass, handleRemoveClasses,
    handleDownloadStylesheet, handleLoadStylesheet, handleMergeStylesheet,
    handleAddRule, handleReplaceClass,
  };
}
