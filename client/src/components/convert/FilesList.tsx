import { FileText } from "lucide-react";
import { formatFileSize } from "@/lib/format/file-size";
import type { ManagedFile } from "@/lib/file-manager/types";

interface Props {
  files: ManagedFile[];
  title?: string;
}

export function FilesList({ files, title = "Selected Files" }: Props) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="font-semibold mb-4">{title} ({files.length})</h2>
      <div className="space-y-2">
        {files.map(file => (
          <div key={file.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 truncate">{file.name}</span>
            <span className="text-sm text-muted-foreground">{formatFileSize(file.size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
