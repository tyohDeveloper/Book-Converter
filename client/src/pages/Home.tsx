import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { UploadZone } from "@/components/files/UploadZone";
import { FileList } from "@/components/files/FileList";
import { ToolsGrid } from "@/components/files/ToolsGrid";
import { listFiles } from "@/lib/file-manager/list-files";
import type { ManagedFile } from "@/lib/file-manager/types";

export default function Home() {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    listFiles().then(setFiles).catch(console.error);
  }, []);

  const handleFilesUploaded = (uploaded: ManagedFile[]) => {
    setFiles(prev => [...prev, ...uploaded]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-primary mb-2">Digital Bindery</h1>
        </div>

        {/* Upload Area */}
        <UploadZone 
          onFilesUploaded={handleFilesUploaded} 
          className="mb-8"
        />

        {/* File Manager */}
        {files.length > 0 && (
          <div className="mb-8">
            <FileList
              files={files}
              selectedIds={selectedIds}
              onFilesChange={setFiles}
              onSelectionChange={setSelectedIds}
            />
          </div>
        )}

        {/* Tools Grid */}
        <ToolsGrid selectedIds={selectedIds} />
      </main>
    </div>
  );
}
