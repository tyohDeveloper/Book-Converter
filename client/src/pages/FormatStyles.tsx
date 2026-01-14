import { useState, useEffect, useMemo, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Loader2, FileText, Palette, Save, Code, Sliders, Wand2, AlignLeft, Files, Settings2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFileSize } from "@/lib/format/file-size";
import { useFormatStyles } from "@/hooks/useFormatStyles";
import { sortAndFormatCss } from "@shared/css/sort-and-format-css";
import { SelectorList } from "@/components/style-editor/SelectorList";
import { SelectorEditPanel } from "@/components/style-editor/SelectorEditPanel";
import { MultiEditPanel } from "@/components/style-editor/MultiEditPanel";
import { VisualEditorHeader } from "@/components/style-editor/VisualEditorHeader";
import { StyleManagementTab } from "@/components/style-editor/StyleManagementTab";
import { FontPicker } from "@/components/font-picker/FontPicker";
import { listFiles } from "@/lib/file-manager/list-files";
import type { ManagedFile } from "@/lib/file-manager/types";

function parseFileIds(s: string): string[] {
  const p = new URLSearchParams(s);
  return p.get('files')?.split(',').filter(Boolean) || (p.get('file') ? [p.get('file')!] : []);
}

export default function FormatStyles() {
  const searchString = useSearch();
  const initialFileIds = useMemo(() => parseFileIds(searchString), [searchString]);
  const [, setLocation] = useLocation();
  const {
    file, multiFiles, isMultiFile, isCssOnlyMode, styles, setStyles, handleRawChange, selectedDeclarations, updateDeclaration, state, error,
    textareaRef, hasChanges, handleSave, handleFontSelect,
    mode, handleModeChange, editableRules, selectedSelector, setSelectedSelector, inlineCounts, usageCounts,
    hasInlineStyles, hasMultiClassStyles, hasConsolidatableStyles, handleSimplify, handleRemoveRule,
    handleMergeStylesheet, handleAddRule, handleAddRuleWithDeclarations, handleReplaceClass,
    multiEditMode, toggleMultiEditMode, multiEditSelection, toggleMultiEditSelection, clearMultiEditSelection, multiEditDeclarations,
  } = useFormatStyles({ initialFileIds });
  const handleBack = async () => {
    if (hasChanges && state !== "saving") {
      const success = await handleSave();
      if (!success) return;
    }
    setLocation("/");
  };
  const handleCancel = () => {
    if (hasChanges && !confirm("Discard unsaved changes?")) {
      return;
    }
    setLocation("/");
  };

  const [allFiles, setAllFiles] = useState<ManagedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  useEffect(() => { listFiles().then(setAllFiles); }, [state]);
  const mergeableFiles = useMemo(() => allFiles.filter(f => (f.name.endsWith('.css') || f.name.endsWith('.html') || f.name.endsWith('.htm')) && !initialFileIds.includes(f.id)), [allFiles, initialFileIds]);

  const searchMatches = useMemo(() => {
    if (!searchQuery || !styles) return [];
    const matches: number[] = [];
    let idx = 0;
    const query = searchQuery.toLowerCase();
    const lowerStyles = styles.toLowerCase();
    while ((idx = lowerStyles.indexOf(query, idx)) !== -1) {
      matches.push(idx);
      idx += 1;
    }
    return matches;
  }, [searchQuery, styles]);

  const handleSearch = useCallback(() => {
    if (searchMatches.length === 0 || !textareaRef.current) return;
    const pos = searchMatches[searchIndex % searchMatches.length];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos + searchQuery.length);
  }, [searchMatches, searchIndex, searchQuery]);

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const newIndex = (searchIndex + 1) % searchMatches.length;
    setSearchIndex(newIndex);
    if (textareaRef.current) {
      const pos = searchMatches[newIndex];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos + searchQuery.length);
    }
  }, [searchMatches, searchIndex, searchQuery]);

  const handlePrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const newIndex = (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchIndex(newIndex);
    if (textareaRef.current) {
      const pos = searchMatches[newIndex];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos + searchQuery.length);
    }
  }, [searchMatches, searchIndex, searchQuery]);

  useEffect(() => { setSearchIndex(0); }, [searchQuery]);
  useEffect(() => { if (searchQuery && searchMatches.length > 0) handleSearch(); }, [searchMatches]);

  const prettyPrintCss = () => { if (!styles) return; try { setStyles(sortAndFormatCss(styles)); } catch {} };
  const hasClassRules = editableRules.some(r => r.selector.startsWith('.') && !r.selector.includes(' ') && !r.selector.includes(':'));
  const fileCount = isMultiFile ? multiFiles.length : 1;
  const totalSize = isMultiFile ? multiFiles.reduce((s, f) => s + f.size, 0) : (file?.size || 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6"><button onClick={handleBack} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back"><ArrowLeft className="h-4 w-4 mr-2" />Back to File Manager</button></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-4">
            <Palette className="h-10 w-10 text-primary" />
            <div><h1 className="font-serif text-3xl font-bold">Edit Styles {isMultiFile && <span className="text-lg font-normal text-muted-foreground">({fileCount} files)</span>}</h1><p className="text-muted-foreground">Edit fonts, colors, spacing, and other CSS</p></div>
          </div>
          {state === "loading" && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3">Loading styles...</span></div>}
          {state === "error" && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center"><AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" /><h2 className="text-lg font-semibold mb-2">Error</h2><p className="text-muted-foreground mb-4">{error}</p><Button onClick={() => setLocation("/")} data-testid="button-back-home">Back to Home</Button></div>}
          {(state === "ready" || state === "saving") && (file || multiFiles.length > 0 || isCssOnlyMode) && (<>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  {isMultiFile ? <Files className="h-5 w-5 text-primary flex-shrink-0" /> : <FileText className="h-5 w-5 text-primary flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{isMultiFile ? `${fileCount} files selected` : (file?.name || "New Stylesheet")}</p>
                    <p className="text-xs text-muted-foreground">{file || multiFiles.length > 0 ? formatFileSize(totalSize) : "Blank"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={handleBack} disabled={state === "saving"} size="sm" data-testid="button-save-css">{state === "saving" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save</Button>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={state === "saving"} data-testid="button-cancel"><X className="h-4 w-4 mr-2" />Cancel</Button>
                </div>
              </div>
              {isMultiFile && <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">{multiFiles.map(f => <div key={f.id} className="px-2 py-1 bg-muted rounded text-xs truncate max-w-48" title={f.name}>{f.name}</div>)}</div>}
            </div>
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <Tabs value={mode} onValueChange={v => handleModeChange(v as "visual" | "management" | "raw")}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="visual" data-testid="tab-visual"><Sliders className="h-4 w-4 mr-2" />Visual Editor</TabsTrigger><TabsTrigger value="management" data-testid="tab-management"><Settings2 className="h-4 w-4 mr-2" />Style Management</TabsTrigger><TabsTrigger value="raw" data-testid="tab-raw"><Code className="h-4 w-4 mr-2" />Raw CSS</TabsTrigger></TabsList>
                <TabsContent value="visual" className="mt-4"><div className="flex gap-4 h-[500px]"><div className="w-64 flex-shrink-0 rounded-lg border bg-muted/30 flex flex-col h-full overflow-hidden"><VisualEditorHeader hasClassRules={hasClassRules} saving={state === "saving"} multiEditMode={multiEditMode} multiEditCount={multiEditSelection.size} onToggleMultiEditMode={toggleMultiEditMode} onClearMultiEditSelection={clearMultiEditSelection} /><div className="flex-1 min-h-0 overflow-hidden"><SelectorList rules={editableRules} selectedSelector={selectedSelector} onSelect={setSelectedSelector} disabled={state === "saving"} inlineCounts={inlineCounts} usageCounts={usageCounts} className="h-full" multiEditMode={multiEditMode} multiEditSelection={multiEditSelection} onToggleMultiEdit={toggleMultiEditSelection} /></div></div><div className="flex-1 flex flex-col h-full overflow-hidden">{multiEditMode ? <MultiEditPanel selectors={Array.from(multiEditSelection)} declarations={multiEditDeclarations} saving={state === "saving"} onDeclarationChange={updateDeclaration} onFontSelect={handleFontSelect} /> : selectedSelector ? <SelectorEditPanel selector={selectedSelector} declarations={selectedDeclarations} saving={state === "saving"} onDeclarationChange={updateDeclaration} onFontSelect={handleFontSelect} /> : <div className="text-center py-12 text-muted-foreground"><p>Select a CSS rule to edit.</p><p className="text-sm mt-2">Locked rules can be edited in Raw CSS tab.</p></div>}</div></div></TabsContent>
                <TabsContent value="management" className="mt-4"><StyleManagementTab rules={editableRules} saving={state === "saving"} mergeableFiles={mergeableFiles} currentCss={styles} onAddRule={handleAddRule} onAddRuleWithDeclarations={handleAddRuleWithDeclarations} onDeleteRule={handleRemoveRule} onReplaceClass={handleReplaceClass} onMergeStylesheet={handleMergeStylesheet} /></TabsContent>
                <TabsContent value="raw" className="mt-4 space-y-4"><div className="flex items-center justify-between flex-wrap gap-2"><div className="flex items-center gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CSS Code</h3><Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={prettyPrintCss} title="Format"><AlignLeft className="h-3 w-3 mr-1" />Format</Button></div><div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) handlePrevMatch(); else handleNextMatch(); } if (e.key === 'Escape') { setSearchQuery(''); textareaRef.current?.focus(); } }} placeholder="Find (Ctrl+F)" className="pl-7 h-7 w-40 text-xs" data-testid="input-css-search" autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} /></div>{searchMatches.length > 0 && <span className="text-xs text-muted-foreground">{searchIndex + 1}/{searchMatches.length}</span>}<FontPicker onSelect={handleFontSelect} disabled={state === "saving"} /></div></div><Textarea ref={textareaRef} value={styles} onChange={e => handleRawChange(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); const searchInput = document.querySelector('[data-testid="input-css-search"]') as HTMLInputElement; if (searchInput) searchInput.focus(); } }} placeholder="body { font-family: serif; }" className="font-mono text-sm min-h-[400px] resize-y" disabled={state === "saving"} data-testid="textarea-css-editor" autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} /></TabsContent>
              </Tabs>
              {hasConsolidatableStyles && <div className="pt-2 border-t"><Button variant="secondary" onClick={handleSimplify} disabled={state === "saving"} data-testid="button-simplify-inline"><Wand2 className="h-4 w-4 mr-2" />{hasInlineStyles && hasMultiClassStyles ? "Consolidate Styles" : hasInlineStyles ? "Convert Inline" : "Consolidate"}</Button></div>}
            </div>
          </>)}
        </motion.div>
      </main>
    </div>
  );
}
