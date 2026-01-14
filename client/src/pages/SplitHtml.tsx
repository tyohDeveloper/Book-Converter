import { Navbar } from "@/components/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Download, AlertCircle, Loader2, FileText, Scissors, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatFileSize } from "@/lib/format/file-size";
import { downloadFile } from "@/lib/file-manager/download-file";
import { useSplitHtml } from "@/hooks/useSplitHtml";

export default function SplitHtml() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const singleFile = params.get('file');
  const fileIdsParam = params.get('files');
  const initialFileIds = singleFile ? [singleFile] : (fileIdsParam ? fileIdsParam.split(',') : []);
  const [, setLocation] = useLocation();

  const {
    htmlFile,
    state,
    error,
    outputFile,
    outputFiles,
    chapterCount,
    settings,
    updateSettings,
    split,
    download,
  } = useSplitHtml({ initialFileIds });

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
            <Scissors className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-serif text-3xl font-bold">Split HTML</h1>
              <p className="text-muted-foreground">Extract individual chapters as XHTML files</p>
            </div>
          </div>

          {state === "loading" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Loading file...</span>
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

          {(state === "ready" || state === "converting") && htmlFile && (
            <>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Source File
                </h3>
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded" data-testid="text-html-file">
                  <FileText className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{htmlFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(htmlFile.size)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="exclude-toc" className="font-medium">Exclude Table of Contents</Label>
                    <p className="text-sm text-muted-foreground">Skip the ToC chapter from output</p>
                  </div>
                  <Switch
                    id="exclude-toc"
                    checked={settings.excludeToc}
                    onCheckedChange={(v) => updateSettings('excludeToc', v)}
                    data-testid="switch-exclude-toc"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Output Format</Label>
                  <RadioGroup 
                    value={settings.outputFormat} 
                    onValueChange={(v) => updateSettings('outputFormat', v as "zip" | "individual")} 
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="zip" id="format-zip" data-testid="radio-format-zip" />
                      <Label htmlFor="format-zip" className="font-normal cursor-pointer flex items-center gap-2">
                        <FileArchive className="h-4 w-4" />
                        ZIP Archive
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="format-individual" data-testid="radio-format-individual" />
                      <Label htmlFor="format-individual" className="font-normal cursor-pointer flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Individual Files
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {settings.outputFormat === 'zip' 
                      ? 'All chapters will be packaged into a single ZIP file' 
                      : 'Each chapter will be saved as a separate XHTML file in File Manager'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={split} 
                  disabled={state === "converting"} 
                  className="flex-1" 
                  data-testid="button-split"
                >
                  {state === "converting" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Splitting...</>
                  ) : (
                    <><Scissors className="h-4 w-4 mr-2" />Split into Chapters</>
                  )}
                </Button>
              </div>
            </>
          )}

          {state === "complete" && outputFile && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <FileArchive className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Split Complete!</h2>
              <p className="text-muted-foreground mb-1">{chapterCount} chapters extracted</p>
              <p className="text-muted-foreground mb-4">{outputFile.name} ({formatFileSize(outputFile.size)})</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={download} data-testid="button-download">
                  <Download className="h-4 w-4 mr-2" />Download ZIP
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-done">Done</Button>
              </div>
            </div>
          )}

          {state === "complete" && outputFiles.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="text-center mb-6">
                <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Split Complete!</h2>
                <p className="text-muted-foreground">{chapterCount} chapters extracted as individual XHTML files</p>
              </div>
              
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {outputFiles.map((file, index) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded" data-testid={`text-output-file-${index}`}>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => downloadFile(file.id)} data-testid={`button-download-${index}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-done">Done</Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
