import type { ReactNode } from "react";
import { CheckSquare, Square, Trash2, Download, Clock, FileType, FileOutput, Code2, FileText, Upload, Sparkles, RefreshCw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileItem } from "./FileItem";
import { useFileList, type SortType } from "@/hooks/useFileList";
import type { ManagedFile } from "@/lib/file-manager/types";

function SortButton({ 
  sortType, 
  value, 
  onClick, 
  icon, 
  label, 
  border 
}: { 
  sortType: SortType; 
  value: SortType; 
  onClick: (v: SortType) => void; 
  icon: ReactNode; 
  label: string; 
  border?: boolean;
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "px-2 py-1.5 text-xs font-medium transition-colors flex items-center gap-1",
        sortType === value ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
        border && "border-l"
      )}
      data-testid={`button-sort-${value}`}
      title={`Sort by ${label}`}
    >
      {icon}
    </button>
  );
}

interface FileListProps {
  files: ManagedFile[];
  selectedIds: Set<string>;
  onFilesChange: (files: ManagedFile[]) => void;
  onSelectionChange: (ids: Set<string>) => void;
}

export function FileList({ 
  files, 
  selectedIds, 
  onFilesChange, 
  onSelectionChange 
}: FileListProps) {
  const {
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
  } = useFileList({ files, selectedIds, onFilesChange, onSelectionChange });

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-secondary/30 space-y-3">
        {/* Line 1: File count */}
        <div className="font-medium">
          {files.length} file{files.length !== 1 ? 's' : ''}
          {selectedIds.size > 0 && (
            <span className="text-primary ml-2">
              ({selectedIds.size} selected)
            </span>
          )}
        </div>

        {/* Line 2: Selection buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-xs"
            data-testid="button-select-all"
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectNone}
            className="text-xs"
            disabled={selectedIds.size === 0}
            data-testid="button-select-none"
          >
            <Square className="h-4 w-4 mr-1" />
            None
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectHtml}
            className="text-xs"
            data-testid="button-select-html"
          >
            <Code2 className="h-4 w-4 mr-1" />
            HTML
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectPdf}
            className="text-xs"
            data-testid="button-select-pdf"
          >
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectCss}
            className="text-xs"
            data-testid="button-select-css"
          >
            <Palette className="h-4 w-4 mr-1" />
            CSS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectNew}
            className="text-xs"
            data-testid="button-select-new"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            New
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectUploaded}
            className="text-xs"
            data-testid="button-select-uploaded"
          >
            <Upload className="h-4 w-4 mr-1" />
            Uploaded
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={invertSelection}
            className="text-xs"
            disabled={files.length === 0}
            data-testid="button-invert-selection"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Invert
          </Button>
        </div>

        {/* Line 3: Sort options, download/delete actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border rounded-md overflow-hidden">
            <SortButton sortType={sortType} value="name" onClick={setSortType} icon={<span className="text-[10px] font-bold">A-Z</span>} label="Name" />
            <SortButton sortType={sortType} value="natural" onClick={setSortType} icon={<span className="text-[10px] font-bold">1-10</span>} label="Natural" border />
            <SortButton sortType={sortType} value="datetime" onClick={setSortType} icon={<Clock className="h-3 w-3" />} label="Date" border />
            <SortButton sortType={sortType} value="type" onClick={setSortType} icon={<FileType className="h-3 w-3" />} label="Type" border />
            <SortButton sortType={sortType} value="source" onClick={setSortType} icon={<FileOutput className="h-3 w-3" />} label="Source" border />
            <SortButton sortType={sortType} value="custom" onClick={setSortType} icon={<span className="text-[10px] font-bold">⋮⋮</span>} label="Custom" border />
          </div>

          {selectedIds.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSelected}
                className="text-xs"
                data-testid="button-download-selected"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteSelected}
                className="text-destructive hover:text-destructive text-xs"
                data-testid="button-delete-selected"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="text-xs"
            disabled={files.length === 0}
            data-testid="button-download-all"
          >
            <Download className="h-4 w-4 mr-1" />
            Download All
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive text-xs"
            disabled={files.length === 0}
            data-testid="button-clear-all"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="divide-y max-h-[400px] overflow-y-auto">
        {sortedFiles.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            isSelected={selectedIds.has(file.id)}
            isDragged={draggedId === file.id}
            sortType={sortType}
            onSelect={toggleSelect}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onView={handleView}
            onRename={handleRename}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
