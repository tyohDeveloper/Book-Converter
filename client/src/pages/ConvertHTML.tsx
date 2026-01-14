import { Navbar } from "@/components/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Download, AlertCircle, X, Loader2, Code2, ExternalLink, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format/file-size";
import { getSessionId } from "@/lib/session";
import { useHtmlConversion } from "@/hooks/useHtmlConversion";
import { FilesList } from "@/components/convert/FilesList";
import { HtmlSettingsPanel } from "@/components/convert/HtmlSettingsPanel";

export default function ConvertHTML() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const fileIdsParam = params.get('files');
  const initialFileIds = fileIdsParam ? fileIdsParam.split(',') : [];
  const [, setLocation] = useLocation();

  const {
    files, state, error, outputFile, outputFiles, settings,
    updateSettings, convert, download, downloadSingle, downloadAll, cancel
  } = useHtmlConversion({ initialFileIds });

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
            <Code2 className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-serif text-3xl font-bold">Convert PDF to HTML</h1>
              <p className="text-muted-foreground">Create a styled HTML document from your PDFs</p>
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

          {(state === "ready" || state === "converting") && (
            <>
              <FilesList files={files} />
              <HtmlSettingsPanel settings={settings} onUpdate={updateSettings} />

              <div className="flex gap-4">
                <Button onClick={convert} disabled={state === "converting"} className="flex-1" data-testid="button-convert">
                  {state === "converting" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Converting...</>
                  ) : (
                    <><Code2 className="h-4 w-4 mr-2" />Convert PDF to HTML</>
                  )}
                </Button>
                {state === "converting" && (
                  <Button variant="outline" onClick={cancel} data-testid="button-cancel">
                    <X className="h-4 w-4 mr-2" />Cancel
                  </Button>
                )}
              </div>
            </>
          )}

          {state === "complete" && outputFile && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <Code2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">HTML Created Successfully!</h2>
              <p className="text-muted-foreground mb-4">{outputFile.name} ({formatFileSize(outputFile.size)})</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={() => window.open(`/api/files/${outputFile.id}/view?session=${getSessionId()}`, '_blank')} data-testid="button-view">
                  <ExternalLink className="h-4 w-4 mr-2" />View Online
                </Button>
                <Button variant="outline" onClick={download} data-testid="button-download">
                  <Download className="h-4 w-4 mr-2" />Download
                </Button>
                <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-done">Done</Button>
              </div>
            </div>
          )}

          {state === "complete" && outputFiles.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="text-center mb-6">
                <Code2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">{outputFiles.length} XHTML Files Created!</h2>
              </div>
              <div className="space-y-2 mb-6">
                {outputFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-background rounded-lg border" data-testid={`output-file-${file.id}`}>
                    <div className="flex items-center gap-3">
                      <FileCode2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-muted-foreground text-sm">({formatFileSize(file.size)})</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => window.open(`/api/files/${file.id}/view?session=${getSessionId()}`, '_blank')} data-testid={`button-view-${file.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadSingle(file.id)} data-testid={`button-download-${file.id}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={downloadAll} data-testid="button-download-all">
                  <Download className="h-4 w-4 mr-2" />Download All
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
