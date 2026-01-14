import { Navbar } from "@/components/Navbar";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Bug, Loader2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePdfDebug } from "@/hooks/usePdfDebug";
import type { DebugMode } from "@/lib/pdf-debug-api";

export default function Debug() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const fileIdParam = params.get('file');

  const {
    files, selectedFileId, setSelectedFileId, state, error, debugInfo,
    currentPage, mode, analyze, loadPage, switchMode
  } = usePdfDebug(fileIdParam);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <Bug className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/"><Button data-testid="button-back-home">Back to Home</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <Bug className="w-8 h-8 text-primary" />
            <h1 className="font-serif text-3xl font-bold">PDF Debugger</h1>
          </div>

          <p className="text-muted-foreground mb-8">
            Examine PDF structure with multiple views: Poppler text extraction, raw PDF operators, or pdf.js text elements.
          </p>

          <div className="bg-card rounded-lg border p-6 mb-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Select PDF File</label>
                <Select value={selectedFileId || ""} onValueChange={setSelectedFileId} disabled={state === "analyzing"}>
                  <SelectTrigger data-testid="select-debug-file"><SelectValue placeholder="Choose a PDF file" /></SelectTrigger>
                  <SelectContent>
                    {files.map(file => <SelectItem key={file.id} value={file.id}>{file.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={analyze} disabled={!selectedFileId || state === "analyzing"} data-testid="button-analyze-pdf">
                {state === "analyzing" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : "Analyze Structure"}
              </Button>
            </div>
          </div>

          {debugInfo && debugInfo.pages.length > 0 && (
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold" data-testid="text-debug-filename">{debugInfo.fileName}</h2>
                  <p className="text-sm text-muted-foreground">{debugInfo.numPages} pages total</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => loadPage(currentPage - 1)} disabled={currentPage <= 1} data-testid="button-prev-page">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3" data-testid="text-page-number">Page {currentPage} of {debugInfo.numPages}</span>
                  <Button variant="outline" size="sm" onClick={() => loadPage(currentPage + 1)} disabled={currentPage >= debugInfo.numPages} data-testid="button-next-page">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Tabs value={mode} onValueChange={(v) => switchMode(v as DebugMode)} className="w-full">
                <div className="px-4 pt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="textBlocks" data-testid="tab-textblocks">Text Blocks</TabsTrigger>
                    <TabsTrigger value="poppler" data-testid="tab-poppler">Poppler</TabsTrigger>
                    <TabsTrigger value="operators" data-testid="tab-operators">Operators</TabsTrigger>
                    <TabsTrigger value="pdfjsText" data-testid="tab-pdfjs">pdf.js</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="textBlocks" className="mt-0">
                  {debugInfo.mode === "textBlocks" && debugInfo.pages.map(page => (
                    <div key={page.pageNumber} className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Page {page.pageNumber}</h3>
                        <span className="text-sm text-muted-foreground">({page.blocks.length} text blocks)</span>
                      </div>
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {page.blocks.map(block => (
                          <div key={block.blockNumber} className="bg-muted/50 rounded p-4" data-testid={`block-${page.pageNumber}-${block.blockNumber}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-primary">Block {block.blockNumber}</span>
                              <span className="text-xs text-muted-foreground">({block.operatorCount} operators)</span>
                            </div>
                            <pre className="font-mono text-sm whitespace-pre-wrap break-words">{block.text}</pre>
                          </div>
                        ))}
                        {page.blocks.length === 0 && <div className="text-center py-8 text-muted-foreground">No text blocks found</div>}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="poppler" className="mt-0">
                  {debugInfo.mode === "poppler" && debugInfo.pages.map(page => (
                    <div key={page.pageNumber} className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Page {page.pageNumber}</h3>
                      </div>
                      <pre className="bg-muted/50 rounded p-4 font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-[600px] overflow-y-auto">
                        {page.text || <span className="text-muted-foreground italic">(empty page)</span>}
                      </pre>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="operators" className="mt-0">
                  {debugInfo.mode === "operators" && debugInfo.pages.map(page => (
                    <div key={page.pageNumber} className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Page {page.pageNumber}</h3>
                        <span className="text-sm text-muted-foreground">({page.width.toFixed(0)} x {page.height.toFixed(0)} pts, {page.operators.length} operators)</span>
                      </div>
                      <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-sm">
                        {page.operators.map((op, idx) => (
                          <div key={idx} className="flex gap-2 hover:bg-muted/50 px-2 py-0.5 rounded" data-testid={`operator-${page.pageNumber}-${idx}`}>
                            <span className="text-muted-foreground text-xs w-12 shrink-0 text-right">{idx + 1}</span>
                            <span className="text-blue-600 font-semibold shrink-0 w-40">{op.name}</span>
                            {op.text ? <span className="text-green-700 font-medium">"{op.text}"</span> : <span className="text-muted-foreground break-all">{op.args.length > 0 ? op.args.join(' ') : ''}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="pdfjsText" className="mt-0">
                  {debugInfo.mode === "pdfjsText" && debugInfo.pages.map(page => (
                    <div key={page.pageNumber} className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Page {page.pageNumber}</h3>
                        <span className="text-sm text-muted-foreground">({page.width.toFixed(0)} x {page.height.toFixed(0)} pts, {page.elements.length} elements)</span>
                      </div>
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {page.elements.map((el, idx) => (
                          <div key={idx} className="bg-muted/50 rounded p-3 font-mono text-sm" data-testid={`element-${page.pageNumber}-${idx}`}>
                            <div className="flex items-start gap-4">
                              <div className="text-muted-foreground text-xs shrink-0 w-16">[{idx + 1}] {el.type}</div>
                              <div className="flex-1">
                                <div className="whitespace-pre-wrap break-words">{el.content || <span className="text-muted-foreground italic">(empty)</span>}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                                  <span>x:{el.x.toFixed(1)}</span>
                                  <span>y:{el.y.toFixed(1)}</span>
                                  <span>w:{el.width.toFixed(1)}</span>
                                  <span>h:{el.height.toFixed(1)}</span>
                                  {el.fontName && <span>font: {el.fontName}</span>}
                                  <span className={el.hasEOL ? "text-green-600 font-semibold" : "text-red-500"}>hasEOL: {el.hasEOL ? "true" : "false"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {files.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No PDF files found. Upload some PDFs first.</p>
              <Link href="/"><Button variant="outline" className="mt-4" data-testid="button-upload-pdfs">Upload PDFs</Button></Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
