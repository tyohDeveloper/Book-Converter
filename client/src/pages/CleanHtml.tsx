import { Navbar } from "@/components/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Loader2, FileText, Eraser, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatFileSize } from "@/lib/format/file-size";
import { useCleanHtml } from "@/hooks/useCleanHtml";

export default function CleanHtml() {
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
    stats,
    settings,
    updateSettings,
    clean,
  } = useCleanHtml({ initialFileIds });

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
            <Eraser className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-serif text-3xl font-bold">Clean HTML</h1>
              <p className="text-muted-foreground">Remove empty spans, whitespace styles, and stray line breaks</p>
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

          {(state === "ready" || state === "cleaning") && htmlFile && (
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cleanup Options</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-null-spans" className="font-medium">Remove Empty Spans</Label>
                    <p className="text-sm text-muted-foreground">Remove &lt;span&gt; elements with no attributes, keeping content</p>
                  </div>
                  <Switch
                    id="remove-null-spans"
                    checked={settings.removeNullSpans}
                    onCheckedChange={(v) => updateSettings('removeNullSpans', v)}
                    data-testid="switch-remove-null-spans"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-whitespace-styles" className="font-medium">Remove Whitespace Styles</Label>
                    <p className="text-sm text-muted-foreground">Strip white-space, line-height, letter-spacing from styles</p>
                  </div>
                  <Switch
                    id="remove-whitespace-styles"
                    checked={settings.removeWhitespaceStyles}
                    onCheckedChange={(v) => updateSettings('removeWhitespaceStyles', v)}
                    data-testid="switch-remove-whitespace-styles"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-br" className="font-medium">Remove Inter-Paragraph Breaks</Label>
                    <p className="text-sm text-muted-foreground">Remove &lt;br/&gt; elements between paragraph blocks</p>
                  </div>
                  <Switch
                    id="remove-br"
                    checked={settings.removeInterparagraphBr}
                    onCheckedChange={(v) => updateSettings('removeInterparagraphBr', v)}
                    data-testid="switch-remove-br"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="flatten-nested" className="font-medium">Deep Flatten/Clean Nested Elements</Label>
                    <p className="text-sm text-muted-foreground">Recursively promote headers, paragraphs, and nested divs while removing empty tags</p>
                  </div>
                  <Switch
                    id="flatten-nested"
                    checked={settings.flattenNestedElements}
                    onCheckedChange={(v) => updateSettings('flattenNestedElements', v)}
                    data-testid="switch-flatten-nested"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-undefined-classes" className="font-medium">Remove Undefined Classes</Label>
                    <p className="text-sm text-muted-foreground">Strip class attributes that have no CSS rules</p>
                  </div>
                  <Switch
                    id="remove-undefined-classes"
                    checked={settings.removeUndefinedClasses}
                    onCheckedChange={(v) => updateSettings('removeUndefinedClasses', v)}
                    data-testid="switch-remove-undefined-classes"
                  />
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
                  onClick={clean} 
                  disabled={state === "cleaning"} 
                  className="flex-1" 
                  data-testid="button-clean"
                >
                  {state === "cleaning" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cleaning...</>
                  ) : (
                    <><Eraser className="h-4 w-4 mr-2" />Clean HTML</>
                  )}
                </Button>
              </div>
            </>
          )}

          {state === "complete" && outputFile && stats && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="text-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Cleanup Complete!</h2>
                <p className="text-muted-foreground">{outputFile.name} ({formatFileSize(outputFile.size)})</p>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded">
                  <p className="text-2xl font-bold text-primary">{stats.nullSpansRemoved}</p>
                  <p className="text-sm text-muted-foreground">Empty Spans</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded">
                  <p className="text-2xl font-bold text-primary">{stats.whitespaceStylesRemoved}</p>
                  <p className="text-sm text-muted-foreground">Style Props</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded">
                  <p className="text-2xl font-bold text-primary">{stats.brElementsRemoved}</p>
                  <p className="text-sm text-muted-foreground">BR Elements</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded">
                  <p className="text-2xl font-bold text-primary">{stats.nestedElementsFlattened}</p>
                  <p className="text-sm text-muted-foreground">Nested Fixed</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded">
                  <p className="text-2xl font-bold text-primary">{stats.undefinedClassesRemoved}</p>
                  <p className="text-sm text-muted-foreground">Classes Strip</p>
                </div>
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
