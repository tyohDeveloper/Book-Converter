import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { withAsyncToast } from "@/lib/async-toast";
import { deleteFile } from "@/lib/file-manager/delete-file";
import { clearAllFiles } from "@/lib/file-manager/clear-all-files";
import { downloadFile } from "@/lib/file-manager/download-file";
import { downloadSelectedFiles } from "@/lib/file-manager/download-selected-files";
import { viewFile } from "@/lib/file-manager/view-file";
import { renameFile } from "@/lib/file-manager/rename-file";
import { sortFiles, type SortType } from "@/lib/sort-files";
import type { ManagedFile } from "@/lib/file-manager/types";

export type { SortType } from "@/lib/sort-files";

interface UseFileListProps {
  files: ManagedFile[];
  selectedIds: Set<string>;
  onFilesChange: (files: ManagedFile[]) => void;
  onSelectionChange: (ids: Set<string>) => void;
}

export function useFileList({ 
  files, 
  selectedIds, 
  onFilesChange, 
  onSelectionChange 
}: UseFileListProps) {
  const [sortType, setSortType] = useState<SortType>('natural');
  const [customOrder, setCustomOrder] = useState<string[]>(files.map(f => f.id));
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    setCustomOrder(files.map(f => f.id));
  }, [files.length]);

  const toggleSelect = useCallback((fileId: string) => {
    const next = new Set(selectedIds);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    onSelectionChange(next);
  }, [selectedIds, onSelectionChange]);

  const selectAll = useCallback(() => {
    onSelectionChange(new Set(files.map(f => f.id)));
  }, [files, onSelectionChange]);

  const selectNone = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const selectByType = useCallback((extensions: string[]) => {
    const matching = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return extensions.includes(ext);
    });
    onSelectionChange(new Set(matching.map(f => f.id)));
  }, [files, onSelectionChange]);

  const selectHtml = useCallback(() => selectByType(['html', 'htm', 'xhtml']), [selectByType]);
  const selectPdf = useCallback(() => selectByType(['pdf']), [selectByType]);
  const selectCss = useCallback(() => selectByType(['css']), [selectByType]);

  const selectNew = useCallback(() => {
    const newFiles = files.filter(f => f.isOutput);
    onSelectionChange(new Set(newFiles.map(f => f.id)));
  }, [files, onSelectionChange]);

  const selectUploaded = useCallback(() => {
    const uploadedFiles = files.filter(f => !f.isOutput);
    onSelectionChange(new Set(uploadedFiles.map(f => f.id)));
  }, [files, onSelectionChange]);

  const invertSelection = useCallback(() => {
    const inverted = files.filter(f => !selectedIds.has(f.id));
    onSelectionChange(new Set(inverted.map(f => f.id)));
  }, [files, selectedIds, onSelectionChange]);

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    try {
      await withAsyncToast(
        async () => {
          for (const id of idsToDelete) {
            await deleteFile(id);
          }
        },
        {
          loading: `Deleting ${idsToDelete.length} file${idsToDelete.length !== 1 ? 's' : ''}...`,
          success: `Deleted ${idsToDelete.length} file${idsToDelete.length !== 1 ? 's' : ''}`,
          error: "Failed to delete files"
        }
      );
      onFilesChange(files.filter(f => !selectedIds.has(f.id)));
      onSelectionChange(new Set());
    } catch {
      // Error already handled by withAsyncToast
    }
  }, [files, selectedIds, onFilesChange, onSelectionChange]);

  const handleDelete = useCallback(async (fileId: string) => {
    try {
      await withAsyncToast(
        () => deleteFile(fileId),
        {
          loading: "Deleting file...",
          success: "File deleted",
          error: "Failed to delete file"
        }
      );
      onFilesChange(files.filter(f => f.id !== fileId));
      const next = new Set(selectedIds);
      next.delete(fileId);
      onSelectionChange(next);
    } catch {
      // Error already handled by withAsyncToast
    }
  }, [files, selectedIds, onFilesChange, onSelectionChange]);

  const handleClearAll = useCallback(async () => {
    try {
      await withAsyncToast(
        () => clearAllFiles(),
        {
          loading: "Clearing all files...",
          success: "All files cleared",
          error: "Failed to clear files"
        }
      );
      onFilesChange([]);
      onSelectionChange(new Set());
    } catch {
      // Error already handled by withAsyncToast
    }
  }, [onFilesChange, onSelectionChange]);

  const handleDownload = useCallback(async (fileId: string) => {
    try {
      await downloadFile(fileId);
      toast.success("Downloaded!");
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  const handleView = useCallback((fileId: string) => {
    viewFile(fileId);
  }, []);

  const handleRename = useCallback(async (fileId: string, newName: string) => {
    try {
      const updated = await renameFile(fileId, newName);
      onFilesChange(files.map(f => f.id === fileId ? { ...f, name: updated.name } : f));
      toast.success("File renamed");
    } catch (error: any) {
      toast.error(error.message || "Failed to rename file");
    }
  }, [files, onFilesChange]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    try {
      await withAsyncToast(
        () => downloadSelectedFiles(Array.from(selectedIds), { stripTimestamps: true }),
        {
          loading: `Downloading ${selectedIds.size} file${selectedIds.size !== 1 ? 's' : ''}...`,
          success: "Download complete!",
          error: (err) => err.message || "Failed to download files"
        }
      );
    } catch {
      // Error already handled by withAsyncToast
    }
  }, [selectedIds]);

  const handleDownloadAll = useCallback(async () => {
    if (files.length === 0) return;
    
    try {
      await withAsyncToast(
        () => downloadSelectedFiles(files.map(f => f.id), { stripTimestamps: true }),
        {
          loading: `Downloading ${files.length} file${files.length !== 1 ? 's' : ''}...`,
          success: "Download complete!",
          error: (err) => err.message || "Failed to download files"
        }
      );
    } catch {
      // Error already handled by withAsyncToast
    }
  }, [files]);

  const handleDragStart = useCallback((e: React.DragEvent, fileId: string) => {
    setDraggedId(fileId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = customOrder.indexOf(draggedId);
    const targetIndex = customOrder.indexOf(targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...customOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      setCustomOrder(newOrder);
      setSortType('custom');
    }
  }, [draggedId, customOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const sortedFiles = useMemo(() => {
    return sortFiles(files, sortType, customOrder);
  }, [files, sortType, customOrder]);

  return {
    sortType,
    setSortType,
    draggedId,
    sortedFiles,
    toggleSelect,
    selectAll,
    selectNone,
    selectHtml,
    selectPdf,
    selectCss,
    selectNew,
    selectUploaded,
    invertSelection,
    deleteSelected,
    handleDelete,
    handleClearAll,
    handleDownload,
    handleView,
    handleRename,
    handleDownloadSelected,
    handleDownloadAll,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
