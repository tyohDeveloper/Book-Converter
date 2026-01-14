import { Navbar } from "@/components/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { ArrowLeft, Download, AlertCircle, Loader2, FileText, Trash2, Check, Type, Edit2, CornerUpLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFileSize } from "@/lib/format/file-size";
import { useHtmlFormat } from "@/hooks/useHtmlFormat";
import { ElementEditor } from "@/components/element-editor/ElementEditor";
import type { ElementTag } from "@/lib/file-manager/elements-api";

export default function FormatHtmlElements() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const fileId = params.get('file') || params.get('files')?.split(',')[0] || '';
  const [, setLocation] = useLocation();

  const {
    file,
    elements,
    editingIndex,
    editingElement,
    state,
    error,
    startEditing,
    stopEditing,
    changeTag,
    addStyle,
    deleteElement,
    splitAtPosition,
    insertBreakAtPosition,
    mergeWithPrevious,
    wrapSelection,
    updateContent,
    insertAfter,
    canMergeWithPrevious,
    markComplete,
    download,
  } = useHtmlFormat({ initialFileId: fileId });

  const [insertingAfter, setInsertingAfter] = useState<number | null>(null);
  const [insertTag, setInsertTag] = useState<ElementTag>("p");
  const [insertContent, setInsertContent] = useState("");

  const handleInsert = async () => {
    if (insertingAfter === null) return;
    await insertAfter(insertingAfter, insertTag, insertContent);
    setInsertingAfter(null);
    setInsertContent("");
    setInsertTag("p");
  };

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
            <Type className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-serif text-3xl font-bold">Edit Elements</h1>
              <p className="text-muted-foreground">Edit, split, merge, or insert elements</p>
            </div>
          </div>

          {state === "loading" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Loading elements...</span>
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

          {(state === "ready" || state === "applying") && file && (
            <>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button variant="outline" onClick={markComplete} data-testid="button-finish">
                    <Check className="h-4 w-4 mr-2" />Finish & Download
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
              )}

              {editingElement && editingIndex !== null ? (
                <ElementEditor
                  element={editingElement}
                  isApplying={state === "applying"}
                  onClose={stopEditing}
                  onChangeTag={(tag) => changeTag(editingIndex, tag)}
                  onAddStyle={(style) => addStyle(editingIndex, style)}
                  onSplit={(pos) => splitAtPosition(editingIndex, pos)}
                  onInsertBreak={(pos) => insertBreakAtPosition(editingIndex, pos)}
                  onWrap={(start, end, kind, style) => wrapSelection(editingIndex, start, end, kind, style)}
                  onUpdateContent={(content) => updateContent(editingIndex, content)}
                />
              ) : (
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Elements ({elements.length})
                  </h3>
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {elements.map((el) => (
                      <React.Fragment key={el.index}>
                        <div 
                          className="flex items-center gap-3 p-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                          data-testid={`element-${el.index}`}
                        >
                          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded uppercase font-bold flex-shrink-0">
                            {el.tag}
                          </span>
                          <p className="flex-1 text-sm truncate">{el.text}</p>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => startEditing(el.index)}
                              disabled={state === "applying"}
                              title="Edit"
                              data-testid={`button-edit-${el.index}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => setInsertingAfter(el.index)}
                              disabled={state === "applying"}
                              title="Insert element after"
                              data-testid={`button-insert-${el.index}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => mergeWithPrevious(el.index)}
                              disabled={state === "applying" || !canMergeWithPrevious(el.index)}
                              title="Merge with previous"
                              data-testid={`button-merge-${el.index}`}
                            >
                              <CornerUpLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteElement(el.index)}
                              disabled={state === "applying"}
                              title="Delete"
                              data-testid={`button-delete-${el.index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {insertingAfter === el.index && (
                          <div className="flex items-center gap-2 p-3 ml-6 bg-primary/5 rounded border border-primary/20">
                            <Select value={insertTag} onValueChange={(v) => setInsertTag(v as ElementTag)}>
                              <SelectTrigger className="w-24" data-testid="select-insert-tag">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="p">p</SelectItem>
                                <SelectItem value="h1">h1</SelectItem>
                                <SelectItem value="h2">h2</SelectItem>
                                <SelectItem value="h3">h3</SelectItem>
                                <SelectItem value="h4">h4</SelectItem>
                                <SelectItem value="h5">h5</SelectItem>
                                <SelectItem value="h6">h6</SelectItem>
                                <SelectItem value="div">div</SelectItem>
                                <SelectItem value="blockquote">blockquote</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={insertContent}
                              onChange={(e) => setInsertContent(e.target.value)}
                              placeholder="Enter content..."
                              className="flex-1"
                              data-testid="input-insert-content"
                            />
                            <Button size="sm" onClick={handleInsert} disabled={state === "applying"} data-testid="button-confirm-insert">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setInsertingAfter(null)} data-testid="button-cancel-insert">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                    {elements.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No formattable elements found in this file.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {state === "applying" && (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Applying change...
                </div>
              )}
            </>
          )}

          {state === "complete" && file && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Editing Complete!</h2>
              <p className="text-muted-foreground mb-4">{file.name}</p>
              <div className="flex gap-4 justify-center flex-wrap">
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
