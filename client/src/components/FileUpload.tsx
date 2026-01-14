import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useFileStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addFiles } = useFileStore();
  const [, setLocation] = useLocation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.type === "application/pdf");
    
    if (validFiles.length > 0) {
      addFiles(validFiles);
      // Simulate upload/processing delay
      setTimeout(() => setLocation("/editor"), 800);
    } else {
      alert("Please upload PDF files only.");
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-xl mx-auto h-64 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer group",
        dragActive
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={true}
        accept=".pdf"
        onChange={handleChange}
      />
      
      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
        <Upload className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors" />
      </div>
      
      <div className="text-center space-y-1">
        <p className="font-serif text-xl font-medium text-foreground">
          Drop your PDF books here
        </p>
        <p className="text-sm text-muted-foreground">
          Combine multiple files of any size into one EPUB
        </p>
      </div>
      
      <div className="absolute bottom-4 flex gap-4 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <CheckCircle size={12} /> Auto-Chapter Detection
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle size={12} /> Smart Paragraphs
        </span>
      </div>
    </div>
  );
}
