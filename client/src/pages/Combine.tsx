import { useState } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Combine as CombineIcon, FileText, GripVertical, Download, Loader2, AlertCircle, ArrowUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format/file-size";
import { useCombine } from "@/hooks/useCombine";
import { naturalCompare } from "@/lib/file-manager/utils";

type SortType = 'name' | 'natural' | 'custom';

export default function Combine() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialFileIds = params.get('files')?.split(',') || [];
  const [, setLocation] = useLocation();
  const [sortType, setSortType] = useState<SortType>('natural');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const {
    availableFiles, selectedFiles, selectedIds, state, result, error,
    outputName, setOutputName, reorder, combine, download
  } = useCombine(initialFileIds);

  const handleSort = (type: SortType) => {
    setSortType(type);
    if (type !== 'custom') {
      const sorted = type === 'natural'
        ? [...selectedFiles].sort((a, b) => naturalCompare(a.name, b.name))
        : [...selectedFiles].sort((a, b) => a.name.localeCompare(b.name));
      sorted.forEach((file, index) => {
        const currentIndex = selectedIds.indexOf(file.id);
        if (currentIndex !== index) reorder(currentIndex, index);
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedId(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const draggedIndex = selectedIds.indexOf(draggedId);
    const targetIndex = selectedIds.indexOf(targetId);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      reorder(draggedIndex, targetIndex);
      setSortType('custom');
    }
  };

  const orderedFiles = selectedIds.map(id => selectedFiles.find(f => f.id === id)).filter(Boolean);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (availableFiles.length < 2) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">At least 2 files are required</p>
            <Link href="/"><Button variant="outline">Back to Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Files
          </Button>
        </Link>

        <div className="text-center mb-8">
          <CombineIcon className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Combine PDFs</h1>
          <p className="text-muted-foreground">Drag files to reorder, then combine into a single PDF</p>
        </div>

        <div className="mb-6">
          <Label htmlFor="outputName" className="text-sm mb-2 block">Output filename</Label>
          <Input id="outputName" value={outputName} onChange={(e) => setOutputName(e.target.value)} placeholder="combined.pdf" data-testid="input-output-name" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{orderedFiles.length} files</span>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center border rounded-md overflow-hidden">
              {(['name', 'natural', 'custom'] as SortType[]).map((type) => (
                <button key={type} onClick={() => handleSort(type)} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", sortType === type ? "bg-primary text-primary-foreground" : "hover:bg-secondary")} data-testid={`button-sort-${type}`}>
                  {type === 'name' ? 'A-Z' : type === 'natural' ? '1-10' : 'Custom'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden mb-6">
          <div className="divide-y">
            {orderedFiles.map((file, index) => file && (
              <div key={file.id} draggable onDragStart={(e) => handleDragStart(e, file.id)} onDragOver={(e) => handleDragOver(e, file.id)} onDragEnd={() => setDraggedId(null)} className={cn("flex items-center gap-3 p-4 hover:bg-secondary/30 cursor-grab", draggedId === file.id && "opacity-50")} data-testid={`file-row-${file.id}`}>
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">{index + 1}</span>
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">PDFs Combined Successfully!</p>
                <p className="text-sm text-green-600">{result.filename} ({formatFileSize(result.size)})</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={download} className="flex-1 gap-2" data-testid="button-download-result"><Download className="h-4 w-4" />Download Now</Button>
              <Button onClick={() => setLocation('/')} variant="outline" className="flex-1 gap-2" data-testid="button-go-to-files"><ArrowLeft className="h-4 w-4" />Back to Files</Button>
            </div>
          </div>
        )}

        {!result && (
          <Button onClick={combine} disabled={state === "combining" || orderedFiles.length < 2} className="w-full gap-2" size="lg" data-testid="button-combine">
            {state === "combining" ? <><Loader2 className="h-5 w-5 animate-spin" />Combining...</> : <><CombineIcon className="h-5 w-5" />Combine PDFs</>}
          </Button>
        )}
      </main>
    </div>
  );
}
