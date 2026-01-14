import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Shrink, Download, FileText, CheckCircle, X, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/format/file-size";
import { useCompression } from "@/hooks/useCompression";
import { useSearch } from "wouter";

export default function Compress() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const singleFile = params.get('file');
  const fileIds = singleFile ? [singleFile] : params.get('files')?.split(',') || [];

  const { file, state, progress, result, error, compress, cancel, download } = useCompression(fileIds);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    );
  }

  if (state === "error" && !file) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">{error}</p>
            <Link href="/"><Button variant="outline">Back to Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center p-6">
        <div className="w-full max-w-2xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Files
            </Button>
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Shrink size={32} />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Compress PDF</h1>
            <p className="text-muted-foreground">Reduce file size by optimizing fonts, images, and content streams</p>
          </motion.div>

          {file && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid="text-filename">{file.name}</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-filesize">
                      {formatFileSize(file.size)}
                      {file.size > 100 * 1024 * 1024 && (
                        <span className="inline-flex items-center gap-1 ml-2 text-amber-600">
                          <AlertTriangle size={12} /> Large file
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {state === "idle" && (
                <Button className="w-full gap-2" size="lg" onClick={compress} data-testid="button-compress">
                  <Shrink size={18} /> Compress PDF
                </Button>
              )}

              {state === "compressing" && (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl border bg-card text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
                    <p className="font-medium">{progress?.message || "Compressing your PDF..."}</p>
                    {progress ? (
                      <div className="mt-4 space-y-2">
                        <Progress value={progress.percent} className="h-2" />
                        <p className="text-sm text-muted-foreground">{progress.percent}% complete</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">This may take a moment for large files</p>
                    )}
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={cancel} data-testid="button-cancel-compress">
                    <X size={18} /> Cancel
                  </Button>
                </div>
              )}

              {state === "error" && error && (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="font-medium text-destructive">Compression Failed</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/"><Button variant="outline" className="w-full" data-testid="button-back-home">Back to Files</Button></Link>
                    <Button onClick={compress} data-testid="button-retry">Retry</Button>
                  </div>
                </div>
              )}

              {state === "complete" && result && (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                      <span className="text-2xl font-bold text-emerald-600">{result.reductionPercent.toFixed(1)}% smaller</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Original</p>
                        <p className="font-mono font-medium">{formatFileSize(result.originalSize)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compressed</p>
                        <p className="font-mono font-medium text-emerald-600">{formatFileSize(result.optimizedSize)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/"><Button variant="outline" className="w-full" data-testid="button-back-to-files">Back to Files</Button></Link>
                    <Button className="gap-2" onClick={download} data-testid="button-download-compressed">
                      <Download size={18} /> Download
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
