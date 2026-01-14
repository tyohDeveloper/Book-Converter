import { useState, useCallback } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format/file-size";
import { toast } from "sonner";
import { useUpload } from "@/hooks/useUpload";
import { SUPPORTED_TYPES, isValidFile } from "@/lib/file-validation";
import type { ManagedFile } from "@/lib/file-manager/types";

interface UploadZoneProps {
  onFilesUploaded: (files: ManagedFile[]) => void;
  acceptedTypes?: string;
  className?: string;
}

export function UploadZone({ 
  onFilesUploaded, 
  acceptedTypes = SUPPORTED_TYPES.join(","),
  className 
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const { uploading, uploadProgress, handleUpload, cancelUpload, inputRef } = useUpload(onFilesUploaded);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [uploading]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (uploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(isValidFile);
      if (validFiles.length > 0) {
        await handleUpload(validFiles);
      } else {
        toast.error("Please upload PDF, DOCX, EPUB, or HTML files only");
      }
    }
  }, [uploading, handleUpload]);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(isValidFile);
      if (validFiles.length > 0) {
        await handleUpload(validFiles);
      }
    }
  }, [handleUpload]);

  if (uploading) {
    return (
      <div 
        className={cn("border-2 border-primary/50 rounded-xl p-8 text-center bg-primary/5", className)}
        data-testid="upload-progress-area"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="w-full max-w-md">
            {uploadProgress?.totalFiles && uploadProgress.totalFiles > 1 && (
              <p className="text-sm text-muted-foreground mb-1">
                File {uploadProgress.currentIndex} of {uploadProgress.totalFiles}
              </p>
            )}
            {uploadProgress?.currentFile && (
              <p className="font-medium text-primary mb-2 truncate" title={uploadProgress.currentFile}>
                {uploadProgress.currentFile}
              </p>
            )}
            <p className="text-lg font-medium mb-2">
              Uploading... {uploadProgress?.percent || 0}%
            </p>
            <Progress value={uploadProgress?.percent || 0} className="h-3 mb-2" />
            {uploadProgress && (
              <p className="text-sm text-muted-foreground mb-3">
                {formatFileSize(uploadProgress.loaded)} of {formatFileSize(uploadProgress.total)}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={cancelUpload}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              data-testid="button-cancel-upload"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 transition-all text-center",
        dragActive 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 bg-muted/30",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      data-testid="upload-dropzone"
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        className="hidden"
        onChange={handleChange}
        data-testid="input-file"
      />
      
      <div className="flex flex-col items-center gap-4">
        <Upload className="h-12 w-12 text-primary" />
        <Button 
          onClick={() => inputRef.current?.click()}
          data-testid="button-browse"
        >
          Browse Files
        </Button>
      </div>
    </div>
  );
}
