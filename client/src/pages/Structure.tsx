import { Link, useSearch, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, FileText, FileType, Image, Info, ChevronDown, ChevronRight, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format/file-size";
import { useStructureAnalysis } from "@/hooks/useStructureAnalysis";

export default function Structure() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const fileIds = params.get('files')?.split(',') || [];
  const [, setLocation] = useLocation();

  const { files, results, loading, error, expandedSections, selectedFileId, setSelectedFileId, selectedResult, toggleSection, cancel } = useStructureAnalysis(fileIds);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Analyzing PDF structure...</p>
            <Button variant="outline" size="sm" onClick={() => { cancel(); setLocation('/'); }} className="text-destructive hover:text-destructive hover:bg-destructive/10" data-testid="button-cancel-structure">
              <X className="h-4 w-4 mr-1" />Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || files.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">{error || "No files found"}</p>
            <Link href="/"><Button variant="outline">Back to Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <Link href="/"><Button variant="ghost" size="sm" className="mb-2 pl-0 hover:bg-transparent hover:text-primary"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Files</Button></Link>
            <h2 className="font-serif text-xl font-bold text-primary">PDF Structure</h2>
            <p className="text-xs text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {results.map((result) => (
              <button key={result.fileId} onClick={() => setSelectedFileId(result.fileId)} className={cn("w-full p-3 text-left border-b transition-colors", selectedFileId === result.fileId ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-secondary/50")} data-testid={`file-button-${result.fileId}`}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium truncate text-sm">{result.fileName}</span>
                </div>
                {result.structure && <p className="text-xs text-muted-foreground mt-1 ml-6">{result.structure.pages.count} pages, {result.structure.fonts.length} fonts</p>}
                {result.error && <p className="text-xs text-destructive mt-1 ml-6">Error</p>}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {selectedResult ? (
            selectedResult.error ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-destructive font-medium">Error analyzing this file:</p>
                <p className="text-sm text-destructive/80 mt-1">{selectedResult.error}</p>
              </div>
            ) : selectedResult.structure ? (
              <div className="max-w-2xl space-y-4">
                <h3 className="font-serif text-2xl font-bold text-primary mb-6">{selectedResult.fileName}</h3>

                {selectedResult.structure.fileInfo.limitedAnalysis && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">Limited Analysis</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">This file is very large ({formatFileSize(selectedResult.structure.fileInfo.sizeBytes)}). Only basic information could be extracted.</p>
                      </div>
                    </div>
                  </div>
                )}

                <StructureSection title="Document Info" icon={<Info size={16} className="text-primary" />} expanded={expandedSections[selectedResult.fileId]?.metadata} onToggle={() => toggleSection(selectedResult.fileId, 'metadata')}>
                  <InfoRow label="Version" value={`PDF ${selectedResult.structure.fileInfo.version || "Unknown"}`} />
                  <InfoRow label="Size" value={formatFileSize(selectedResult.structure.fileInfo.sizeBytes)} />
                  {selectedResult.structure.metadata.title && <InfoRow label="Title" value={selectedResult.structure.metadata.title} />}
                  {selectedResult.structure.metadata.author && <InfoRow label="Author" value={selectedResult.structure.metadata.author} />}
                  {selectedResult.structure.metadata.creator && <InfoRow label="Creator" value={selectedResult.structure.metadata.creator} />}
                  {selectedResult.structure.metadata.producer && <InfoRow label="Producer" value={selectedResult.structure.metadata.producer} />}
                </StructureSection>

                <StructureSection title="Pages" icon={<FileText size={16} className="text-primary" />} badge={selectedResult.structure.pages.count} expanded={expandedSections[selectedResult.fileId]?.pages} onToggle={() => toggleSection(selectedResult.fileId, 'pages')}>
                  <div className="max-h-60 overflow-y-auto pt-3 space-y-1">
                    {selectedResult.structure.pages.dimensions.slice(0, 50).map((dim, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground">Page {i + 1}</span>
                        <span>{dim.width} × {dim.height}pt {dim.rotation > 0 && `(${dim.rotation}°)`}</span>
                      </div>
                    ))}
                    {selectedResult.structure.pages.dimensions.length > 50 && <div className="text-center text-muted-foreground pt-2">+{selectedResult.structure.pages.dimensions.length - 50} more pages</div>}
                  </div>
                </StructureSection>

                <StructureSection title="Fonts" icon={<FileType size={16} className="text-primary" />} badge={selectedResult.structure.fonts.length} expanded={expandedSections[selectedResult.fileId]?.fonts} onToggle={() => toggleSection(selectedResult.fileId, 'fonts')}>
                  {selectedResult.structure.fonts.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto pt-3 space-y-1">
                      {selectedResult.structure.fonts.map((font, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <span className="truncate flex-1" title={font.name}>{font.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-muted-foreground text-xs">{font.type}</span>
                            {font.embedded && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">embedded</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-muted-foreground italic text-center py-4">No fonts detected</div>}
                </StructureSection>

                <StructureSection title="Images" icon={<Image size={16} className="text-primary" />} badge={selectedResult.structure.images.count} expanded={expandedSections[selectedResult.fileId]?.images} onToggle={() => toggleSection(selectedResult.fileId, 'images')}>
                  <div className="pt-3 text-muted-foreground">
                    {selectedResult.structure.images.count > 0 ? `Document contains ${selectedResult.structure.images.count} image${selectedResult.structure.images.count > 1 ? 's' : ''}` : "No images in document"}
                  </div>
                </StructureSection>
              </div>
            ) : null
          ) : (
            <div className="text-center text-muted-foreground py-12">Select a file from the sidebar to view its structure</div>
          )}
        </main>
      </div>
    </div>
  );
}

function StructureSection({ title, icon, badge, expanded, onToggle, children }: { title: string; icon: React.ReactNode; badge?: number; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors">
        <span className="flex items-center gap-2 font-medium">
          {icon}
          {title}
          {badge !== undefined && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{badge}</span>}
        </span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {expanded && <div className="px-4 pb-4 text-sm border-t">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 pt-3 first:pt-3">
      <span className="text-muted-foreground">{label}:</span>
      <span className="col-span-2 truncate">{value}</span>
    </div>
  );
}
