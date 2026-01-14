import { useState } from "react";
import { FileText, FileOutput, GripVertical, Trash2, Download, Eye, FileType, Code2, Pencil, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format/file-size";
import { formatTimestamp } from "@/lib/format/format-timestamp";
import type { ManagedFile } from "@/lib/file-manager/types";

interface FileItemProps {
  file: ManagedFile;
  isSelected: boolean;
  isDragged: boolean;
  sortType: string;
  onSelect: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  onDownload: (fileId: string) => void;
  onView?: (fileId: string) => void;
  onRename?: (fileId: string, newName: string) => void;
  onDragStart: (e: React.DragEvent, fileId: string) => void;
  onDragOver: (e: React.DragEvent, fileId: string) => void;
  onDragEnd: () => void;
}

export function FileItem({
  file,
  isSelected,
  isDragged,
  sortType,
  onSelect,
  onDelete,
  onDownload,
  onView,
  onRename,
  onDragStart,
  onDragOver,
  onDragEnd,
}: FileItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const canSelect = true;
  const fileName = file.name.toLowerCase();
  const isCss = fileName.endsWith('.css');
  const canView = fileName.endsWith('.html') || fileName.endsWith('.htm') || fileName.endsWith('.xhtml') || fileName.endsWith('.pdf') || isCss;
  const isDocx = fileName.endsWith('.docx');
  const isPdf = fileName.endsWith('.pdf');
  const isEpub = fileName.endsWith('.epub');
  const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm') || fileName.endsWith('.xhtml');

  const handleRename = () => {
    if (newName.trim() && newName !== file.name && onRename) {
      onRename(file.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const openRenameDialog = () => {
    setNewName(file.name);
    setIsRenaming(true);
  };

  return (
    <>
      <div
        draggable={sortType === 'custom' && !file.isOutput}
        onDragStart={(e) => onDragStart(e, file.id)}
        onDragOver={(e) => onDragOver(e, file.id)}
        onDragEnd={onDragEnd}
        className={cn(
          "flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors group",
          isSelected && "bg-primary/5",
          isDragged && "opacity-50",
          file.isOutput && "bg-green-500/5 border-l-4 border-l-green-500"
        )}
        data-testid={`file-row-${file.id}`}
      >
        {sortType === 'custom' && !file.isOutput && (
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        )}
        {file.isOutput && (
          <div className="w-4" />
        )}
        
        {canSelect ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(file.id)}
            data-testid={`checkbox-file-${file.id}`}
          />
        ) : (
          <div className="w-4" />
        )}
        
        {file.isOutput ? (
          <FileOutput className="h-5 w-5 text-green-600 flex-shrink-0" />
        ) : isDocx ? (
          <FileType className="h-5 w-5 text-blue-600 flex-shrink-0" />
        ) : isEpub ? (
          <BookOpen className="h-5 w-5 text-green-600 flex-shrink-0" />
        ) : isHtml ? (
          <Code2 className="h-5 w-5 text-orange-600 flex-shrink-0" />
        ) : isCss ? (
          <FileText className="h-5 w-5 text-purple-600 flex-shrink-0" />
        ) : (
          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("font-medium truncate", file.isOutput && "text-green-700")}>{file.name}</p>
            {file.isOutput && file.outputType && (
              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded uppercase font-medium">
                {file.outputType === 'compressed' ? 'Compressed' : file.outputType.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} · {formatTimestamp(file.uploadedAt)}
          </p>
        </div>
        
        <div className="grid grid-cols-5 gap-1">
          {onRename ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={openRenameDialog}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              data-testid={`button-rename-${file.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}
          
          {canView && onView ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(file.id)}
              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              data-testid={`button-view-${file.id}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}
          
          <div className="h-8 w-8" />
          
          {file.isOutput ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDownload(file.id)}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              data-testid={`button-download-${file.id}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(file.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            data-testid={`button-delete-${file.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder="Enter new file name"
              data-testid="input-rename"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(false)} data-testid="button-cancel-rename">
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()} data-testid="button-confirm-rename">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
