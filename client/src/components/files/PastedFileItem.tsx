import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2 } from "lucide-react";

export interface PastedFileData {
  id: string;
  name: string;
  createdAt: Date;
}

interface PastedFileItemProps {
  file: PastedFileData;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
}

export function PastedFileItem({ file, onDownload, onRemove }: PastedFileItemProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
      data-testid={`file-item-${file.id}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm truncate" data-testid={`text-filename-${file.id}`}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {file.createdAt.toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onDownload(file.id)}
          data-testid={`button-download-${file.id}`}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(file.id)}
          data-testid={`button-remove-${file.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
