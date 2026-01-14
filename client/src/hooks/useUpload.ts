import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/file-manager/upload";
import type { ManagedFile, UploadProgress } from "@/lib/file-manager/types";

export interface UseUploadResult {
  uploading: boolean;
  uploadProgress: UploadProgress | null;
  handleUpload: (files: File[]) => Promise<void>;
  cancelUpload: () => void;
  resetInput: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useUpload(onFilesUploaded: (files: ManagedFile[]) => void): UseUploadResult {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleUpload = useCallback(async (newFiles: File[]) => {
    setUploading(true);
    setUploadProgress(null);
    abortControllerRef.current = new AbortController();
    const toastId = toast.loading("Uploading files...");
    
    try {
      const uploaded = await uploadFiles(newFiles, setUploadProgress, abortControllerRef.current.signal);
      toast.dismiss(toastId);
      toast.success(`Uploaded ${uploaded.length} file${uploaded.length > 1 ? 's' : ''}`);
      onFilesUploaded(uploaded);
    } catch (error: unknown) {
      toast.dismiss(toastId);
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message === 'Upload cancelled') {
        toast.info("Upload cancelled");
      } else {
        toast.error(err.message || "Failed to upload files", { duration: 10000 });
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
      abortControllerRef.current = null;
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [onFilesUploaded]);

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const resetInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return {
    uploading,
    uploadProgress,
    handleUpload,
    cancelUpload,
    resetInput,
    inputRef,
  };
}
