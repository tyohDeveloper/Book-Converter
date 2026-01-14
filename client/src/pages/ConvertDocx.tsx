import { Navbar } from "@/components/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Download, AlertCircle, Loader2, FileType, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format/file-size";
import { getSessionId } from "@/lib/session";
import { useDocxConversion } from "@/hooks/useDocxConversion";
import { DocxSettingsForm } from "@/components/conversion/DocxSettingsForm";

export default function ConvertDocx() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const fileIdsParam = params.get('files');
  const initialFileIds = fileIdsParam ? fileIdsParam.split(',') : [];
  const [, setLocation] = useLocation();

  const {
    files,
    state,
    error,
    outputFile,
    settings,
    updateSettings,
    convert,
    download,
    totalSize,
    canView,
  } = useDocxConversion({ initialFileIds });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to File Manager
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-4">
            <FileType className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="font-serif text-3xl font-bold">Convert DOCX</h1>
              <p className="text-muted-foreground">Convert Word documents to HTML, EPUB, or PDF</p>
            </div>
          </div>

          {state === "loading" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Loading files...</span>
            </div>
          )}

          {state === "error" && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => setLocation("/")} data-testid="button-back-home">Back to Home</Button>
            </div>
          )}

          {(state === "ready" || state === "converting") && files.length > 0 && (
            <>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Source Files ({files.length})
                </h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={file.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded" data-testid={`text-source-file-${index}`}>
                      <FileType className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {files.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Total: {formatFileSize(totalSize)} - Files will be combined in the order shown
                  </p>
                )}
              </div>

              <DocxSettingsForm
                settings={settings}
                onSettingsChange={updateSettings}
                disablePdf={files.length > 1}
              />

              {error && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={convert} 
                  disabled={state === "converting"} 
                  className="flex-1" 
                  data-testid="button-convert"
                >
                  {state === "converting" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Converting...</>
                  ) : (
                    <><FileType className="h-4 w-4 mr-2" />Convert {files.length} file{files.length > 1 ? 's' : ''} to {settings.outputFormat.toUpperCase()}</>
                  )}
                </Button>
              </div>
            </>
          )}

          {state === "complete" && outputFile && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <FileType className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Conversion Complete!</h2>
              <p className="text-muted-foreground mb-4">{outputFile.name} ({formatFileSize(outputFile.size)})</p>
              <div className="flex gap-4 justify-center flex-wrap">
                {canView && (
                  <Button onClick={() => window.open(`/api/files/${outputFile.id}/view?session=${getSessionId()}`, '_blank')} data-testid="button-view">
                    <ExternalLink className="h-4 w-4 mr-2" />View
                  </Button>
                )}
                <Button onClick={download} data-testid="button-download">
                  <Download className="h-4 w-4 mr-2" />Download
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-done">Done</Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
