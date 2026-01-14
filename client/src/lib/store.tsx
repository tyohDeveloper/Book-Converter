import React, { createContext, useContext, useState, useRef, ReactNode } from "react";

interface FileContextType {
  files: File[];
  setFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  replaceFile: (index: number, file: File) => void;
  settings: {
    mergeParagraphs: boolean;
    detectChapters: boolean;
    removePageNumbers: boolean;
    sensitivity: number;
    title: string;
    author: string;
    compressionLevel: "fast" | "maximum";
  };
  updateSettings: (key: string, value: boolean | number | string) => void;
  chapters: Array<{ title: string; page: number }>;
  setChapters: (chapters: Array<{ title: string; page: number }>) => void;
  abortController: React.MutableRefObject<AbortController | null>;
  cancelOperation: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);
  const [chapters, setChapters] = useState<Array<{ title: string; page: number }>>([]);
  const [settings, setSettings] = useState({
    mergeParagraphs: true,
    detectChapters: true,
    removePageNumbers: true,
    sensitivity: 50,
    title: "Generated eBook",
    author: "Unknown",
    compressionLevel: "maximum" as "fast" | "maximum",
  });
  const abortController = useRef<AbortController | null>(null);

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const replaceFile = (index: number, file: File) => {
    setFiles((prev) => prev.map((f, i) => i === index ? file : f));
  };

  const updateSettings = (key: string, value: boolean | number | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const cancelOperation = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  return (
    <FileContext.Provider value={{ files, setFiles, addFiles, removeFile, replaceFile, settings, updateSettings, chapters, setChapters, abortController, cancelOperation }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFileStore() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFileStore must be used within a FileProvider");
  }
  return context;
}
