import { Navbar } from "@/components/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Download, AlertCircle, Loader2, FileText, FileType, ChevronDown, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatFileSize } from "@/lib/format/file-size";
import { useHtmlToPdfConversion } from "@/hooks/useHtmlToPdfConversion";
import { useState, useCallback, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import type { PageNumberPosition, PageNumberFormat, PdfDesignRules } from "@shared/contracts/pdf-design-rules";
import { PdfDesignRulesSchema } from "@shared/contracts/pdf-design-rules";

export default function ConvertHtmlToPdf() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const fileId = params.get('file');
  const filesParam = params.get('files');
  const initialFileIds = filesParam ? filesParam.split(',') : (fileId ? [fileId] : []);
  const [, setLocation] = useLocation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    file,
    files,
    isMultiFile,
    state,
    error,
    outputFile,
    outputFiles,
    settings,
    updateSettings,
    updateDesignRules,
    convert,
    download,
    downloadAll,
    downloadSingle,
  } = useHtmlToPdfConversion({ initialFileIds });

  const pageNumbers = settings.designRules.pageNumbers || {};
  const typography = settings.designRules.typography || {};
  const pageBreaks = settings.designRules.pageBreaks || {};

  const saveDesignRules = useCallback(() => {
    const rules = settings.designRules;
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rules.name || 'design-rules'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Design rules saved');
  }, [settings.designRules]);

  const loadDesignRules = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const validated = PdfDesignRulesSchema.parse(parsed);
        updateSettings('designRules', validated);
        toast.success('Design rules loaded');
      } catch (err) {
        toast.error('Invalid design rules file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [updateSettings]);

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
            <FileType className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-serif text-3xl font-bold">Convert HTML to PDF</h1>
              <p className="text-muted-foreground">
                {isMultiFile ? `Convert ${files.length} HTML files to separate PDFs` : "Create a PDF document from HTML"}
              </p>
            </div>
          </div>

          {state === "loading" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Loading files...</span>
            </div>
          )}

          {state === "error" && !outputFile && outputFiles.length === 0 && (
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
                  Source {isMultiFile ? `Files (${files.length})` : "File"}
                </h3>
                <div className="space-y-2">
                  {files.map((f, index) => (
                    <div key={f.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded" data-testid={`text-source-file-${index}`}>
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PDF Settings</h3>
                
                {!isMultiFile && (
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={settings.title}
                      onChange={(e) => updateSettings('title', e.target.value)}
                      placeholder="PDF title"
                      data-testid="input-title"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-base font-medium">Paper Size</Label>
                  <RadioGroup 
                    value={settings.paperSize} 
                    onValueChange={(v) => updateSettings('paperSize', v as 'letter' | 'a4')} 
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="letter" id="paper-letter" data-testid="radio-letter" />
                      <Label htmlFor="paper-letter" className="cursor-pointer">Letter (8.5" x 11")</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a4" id="paper-a4" data-testid="radio-a4" />
                      <Label htmlFor="paper-a4" className="cursor-pointer">A4 (210mm x 297mm)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="landscape"
                    checked={settings.landscape}
                    onCheckedChange={(checked) => updateSettings('landscape', checked)}
                    data-testid="switch-landscape"
                  />
                  <Label htmlFor="landscape" className="cursor-pointer">Landscape orientation</Label>
                </div>
              </div>

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between" data-testid="button-toggle-advanced">
                    <span className="font-medium">Book Design Rules</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 pt-4">
                  <div className="flex items-center justify-between gap-4 px-1">
                    <div className="space-y-1">
                      <Input
                        value={settings.designRules.name || ''}
                        onChange={(e) => updateDesignRules('name', e.target.value)}
                        placeholder="Design rules name (optional)"
                        className="h-8 w-48"
                        data-testid="input-design-rules-name"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={loadDesignRules}
                        accept=".json"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-load-design-rules"
                      >
                        <Upload className="h-4 w-4 mr-2" />Load
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={saveDesignRules}
                        data-testid="button-save-design-rules"
                      >
                        <Save className="h-4 w-4 mr-2" />Save
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Page Numbers</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="page-numbers-enabled"
                        checked={pageNumbers.enabled || false}
                        onCheckedChange={(checked) => updateDesignRules('pageNumbers', { ...pageNumbers, enabled: checked })}
                        data-testid="switch-page-numbers"
                      />
                      <Label htmlFor="page-numbers-enabled" className="cursor-pointer">Show page numbers</Label>
                    </div>

                    {pageNumbers.enabled && (
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="page-position">Position</Label>
                          <Select
                            value={pageNumbers.position || "bottom-center"}
                            onValueChange={(v) => updateDesignRules('pageNumbers', { ...pageNumbers, position: v as PageNumberPosition })}
                          >
                            <SelectTrigger id="page-position" data-testid="select-page-position">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bottom-center">Bottom Center</SelectItem>
                              <SelectItem value="bottom-left">Bottom Left</SelectItem>
                              <SelectItem value="bottom-right">Bottom Right</SelectItem>
                              <SelectItem value="top-center">Top Center</SelectItem>
                              <SelectItem value="top-left">Top Left</SelectItem>
                              <SelectItem value="top-right">Top Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="page-format">Format</Label>
                          <Select
                            value={pageNumbers.format || "numeric"}
                            onValueChange={(v) => updateDesignRules('pageNumbers', { ...pageNumbers, format: v as PageNumberFormat })}
                          >
                            <SelectTrigger id="page-format" data-testid="select-page-format">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="numeric">1, 2, 3...</SelectItem>
                              <SelectItem value="roman-lower">i, ii, iii...</SelectItem>
                              <SelectItem value="roman-upper">I, II, III...</SelectItem>
                              <SelectItem value="alpha-lower">a, b, c...</SelectItem>
                              <SelectItem value="alpha-upper">A, B, C...</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="page-start">Start Number</Label>
                          <Input
                            id="page-start"
                            type="number"
                            min={1}
                            value={pageNumbers.startNumber || 1}
                            onChange={(e) => updateDesignRules('pageNumbers', { ...pageNumbers, startNumber: parseInt(e.target.value) || 1 })}
                            data-testid="input-page-start"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="page-font-size">Font Size</Label>
                          <Input
                            id="page-font-size"
                            value={pageNumbers.fontSize || "10pt"}
                            onChange={(e) => updateDesignRules('pageNumbers', { ...pageNumbers, fontSize: e.target.value })}
                            placeholder="10pt"
                            data-testid="input-page-font-size"
                          />
                        </div>

                        <div className="col-span-2 flex items-center space-x-2">
                          <Switch
                            id="skip-first-page"
                            checked={pageNumbers.skipFirstPage || false}
                            onCheckedChange={(checked) => updateDesignRules('pageNumbers', { ...pageNumbers, skipFirstPage: checked })}
                            data-testid="switch-skip-first"
                          />
                          <Label htmlFor="skip-first-page" className="cursor-pointer">Skip first page (title page)</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Typography</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="prevent-orphans"
                        checked={typography.preventOrphans !== false}
                        onCheckedChange={(checked) => updateDesignRules('typography', { ...typography, preventOrphans: checked })}
                        data-testid="switch-prevent-orphans"
                      />
                      <Label htmlFor="prevent-orphans" className="cursor-pointer">Prevent orphans (isolated lines at page bottom)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="prevent-widows"
                        checked={typography.preventWidows !== false}
                        onCheckedChange={(checked) => updateDesignRules('typography', { ...typography, preventWidows: checked })}
                        data-testid="switch-prevent-widows"
                      />
                      <Label htmlFor="prevent-widows" className="cursor-pointer">Prevent widows (isolated lines at page top)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="no-word-splitting"
                        checked={typography.noWordSplitting !== false}
                        onCheckedChange={(checked) => updateDesignRules('typography', { ...typography, noWordSplitting: checked })}
                        data-testid="switch-no-word-split"
                      />
                      <Label htmlFor="no-word-splitting" className="cursor-pointer">No word splitting across page boundaries</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="keep-headings"
                        checked={typography.keepHeadingsWithContent !== false}
                        onCheckedChange={(checked) => updateDesignRules('typography', { ...typography, keepHeadingsWithContent: checked })}
                        data-testid="switch-keep-headings"
                      />
                      <Label htmlFor="keep-headings" className="cursor-pointer">Keep headings with following content</Label>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Page Breaks</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="avoid-break-blocks"
                        checked={pageBreaks.avoidBreakInsideBlocks !== false}
                        onCheckedChange={(checked) => updateDesignRules('pageBreaks', { ...pageBreaks, avoidBreakInsideBlocks: checked })}
                        data-testid="switch-avoid-break-blocks"
                      />
                      <Label htmlFor="avoid-break-blocks" className="cursor-pointer">Avoid breaking inside quotes, code, tables</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="avoid-break-headings"
                        checked={pageBreaks.avoidBreakAfterHeadings !== false}
                        onCheckedChange={(checked) => updateDesignRules('pageBreaks', { ...pageBreaks, avoidBreakAfterHeadings: checked })}
                        data-testid="switch-avoid-break-headings"
                      />
                      <Label htmlFor="avoid-break-headings" className="cursor-pointer">Avoid page break after headings</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="chapter-new-page"
                        checked={pageBreaks.chapterStartsNewPage || false}
                        onCheckedChange={(checked) => updateDesignRules('pageBreaks', { ...pageBreaks, chapterStartsNewPage: checked })}
                        data-testid="switch-chapter-new-page"
                      />
                      <Label htmlFor="chapter-new-page" className="cursor-pointer">Start each chapter on a new page</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
                    <><FileType className="h-4 w-4 mr-2" />Convert {isMultiFile ? `${files.length} Files` : ''} to PDF</>
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
                <Button onClick={download} data-testid="button-download">
                  <Download className="h-4 w-4 mr-2" />Download
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-done">Done</Button>
              </div>
            </div>
          )}

          {state === "complete" && outputFiles.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="text-center mb-6">
                <FileType className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">{outputFiles.length} PDFs Created!</h2>
              </div>
              <div className="space-y-2 mb-6">
                {outputFiles.map((f, index) => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg" data-testid={`output-file-${index}`}>
                    <div className="flex items-center gap-3">
                      <FileType className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => downloadSingle(f.id)} data-testid={`button-download-${index}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 justify-center">
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
