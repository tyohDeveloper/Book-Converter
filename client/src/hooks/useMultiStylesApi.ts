import { useCallback } from "react";
import { withAsyncToast } from "@/lib/async-toast";
import { updateMultiCssStyles } from "@/lib/file-manager/css/update-multi-css-styles";
import { getMultiCssStyles } from "@/lib/file-manager/css/get-multi-css-styles";
import { removeCssClassMulti } from "@/lib/file-manager/css/remove-css-class-multi";
import { replaceCssClassMulti } from "@/lib/file-manager/css/replace-css-class-multi";
import { downloadFile } from "@/lib/file-manager/download-file";
import type { ParsedStylesheet, MultiFileInfo } from "@/lib/file-manager/css/types";
import type { ManagedFile } from "@/lib/file-manager/types";

export interface MultiStylesApiCallbacks {
  onFilesUpdate: (files: ManagedFile[]) => void;
  onStylesUpdate: (styles: string, parsed?: ParsedStylesheet) => void;
  onStateChange: (state: "loading" | "ready" | "saving" | "error") => void;
  onError: (message: string) => void;
}

function toManagedFile(file: { id: string; name: string; size: number; isOutput?: boolean }): ManagedFile {
  return { id: file.id, name: file.name, size: file.size, uploadedAt: Date.now(), isOutput: file.isOutput ?? true, outputType: "html" };
}

export function useMultiStylesApi(
  files: MultiFileInfo[],
  styles: string,
  callbacks: MultiStylesApiCallbacks
) {
  const { onFilesUpdate, onStylesUpdate, onStateChange, onError } = callbacks;

  const handleSave = useCallback(async () => {
    if (files.length === 0) return null;
    onStateChange("saving");
    try {
      const fileIds = files.map(f => f.id);
      const result = await withAsyncToast(
        () => updateMultiCssStyles(fileIds, styles),
        { loading: `Saving styles to ${files.length} files...`, success: `Styles saved to ${files.length} files!`, error: (err) => err.message || "Failed to save" }
      );
      if (result.files) {
        onFilesUpdate(result.files.map(toManagedFile));
      }
      onStateChange("ready");
      return styles;
    } catch {
      onStateChange("ready");
      return null;
    }
  }, [files, styles, onFilesUpdate, onStateChange]);

  const handleDownload = useCallback(async () => {
    if (files.length === 0) return;
    for (const file of files) {
      await withAsyncToast(
        () => downloadFile(file.id),
        { loading: `Downloading ${file.name}...`, success: "Download started!", error: "Failed to download" }
      );
    }
  }, [files]);

  const handleRemoveClass = useCallback(async (className: string) => {
    if (files.length === 0) return null;
    onStateChange("saving");
    try {
      const fileIds = files.map(f => f.id);
      const result = await withAsyncToast(
        () => removeCssClassMulti(fileIds, className),
        { loading: `Removing .${className} from ${files.length} files...`, success: `Class removed from ${files.length} files!`, error: (err) => err.message || "Failed to remove" }
      );
      const cssResult = await getMultiCssStyles(fileIds);
      onStylesUpdate(cssResult.styles, cssResult.parsed);
      onStateChange("ready");
      return result;
    } catch {
      onStateChange("ready");
      return null;
    }
  }, [files, onStylesUpdate, onStateChange]);

  const handleReplaceClass = useCallback(async (sourceClass: string, targetClass: string) => {
    if (files.length === 0) return null;
    onStateChange("saving");
    try {
      const fileIds = files.map(f => f.id);
      const result = await withAsyncToast(
        () => replaceCssClassMulti(fileIds, sourceClass, targetClass),
        { loading: `Replacing .${sourceClass} with .${targetClass} in ${files.length} files...`, success: `Class replaced in ${files.length} files!`, error: (err) => err.message || "Failed to replace" }
      );
      const cssResult = await getMultiCssStyles(fileIds);
      onStylesUpdate(cssResult.styles, cssResult.parsed);
      onStateChange("ready");
      return result;
    } catch {
      onStateChange("ready");
      return null;
    }
  }, [files, onStylesUpdate, onStateChange]);

  const handleRemoveClasses = useCallback(async (classNames: string[]) => {
    if (files.length === 0 || classNames.length === 0) return null;
    onStateChange("saving");
    try {
      const fileIds = files.map(f => f.id);
      for (const className of classNames) {
        await removeCssClassMulti(fileIds, className);
      }
      const cssResult = await getMultiCssStyles(fileIds);
      onStylesUpdate(cssResult.styles, cssResult.parsed);
      onStateChange("ready");
      return { success: true };
    } catch {
      onStateChange("ready");
      return null;
    }
  }, [files, onStylesUpdate, onStateChange]);

  const handleAddRule = useCallback(async (className: string) => {
    if (files.length === 0 || !className) return null;
    const newRule = `.${className} {\n}\n`;
    const updatedStyles = styles.trim() ? `${styles.trim()}\n\n${newRule}` : newRule;
    onStylesUpdate(updatedStyles);
    return { success: true };
  }, [files, styles, onStylesUpdate]);

  return { handleSave, handleDownload, handleRemoveClass, handleReplaceClass, handleRemoveClasses, handleAddRule };
}
