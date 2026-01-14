import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { listFiles } from "@/lib/file-manager/list-files";
import { getCssStyles } from "@/lib/file-manager/css/get-css-styles";
import { getMultiCssStyles } from "@/lib/file-manager/css/get-multi-css-styles";
import { getCssFileStyles } from "@/lib/file-manager/css/get-css-file-styles";
import { updateCssFileStyles } from "@/lib/file-manager/css/update-css-file-styles";
import type { InlineStyleInfo, SelectorUsage, ParsedStylesheet, CssRule, MultiFileInfo } from "@/lib/file-manager/css/types";
import { isHtmlFile, isCssFile } from "@/lib/file-types";
import type { ManagedFile } from "@/lib/file-manager/types";
import { useStylesApi } from "./useStylesApi";
import { useMultiStylesApi } from "./useMultiStylesApi";
import { useRuleEditor } from "./useRuleEditor";
import { parseCssRules } from "@/lib/css/parse-css-local";
import { sortAndFormatCss } from "@shared/css/sort-and-format-css";
import { buildDeleteInstruction, buildReplaceInstruction, addInstructionComment } from "@/lib/css/css-instructions";

export type StylesState = "loading" | "ready" | "saving" | "complete" | "error";
export type EditorMode = "visual" | "management" | "raw";
export interface UseFormatStylesOptions { initialFileIds: string[]; }

function parseInlineStyle(style: string): Record<string, string> {
  const decls: Record<string, string> = {};
  for (const part of style.split(';')) {
    const idx = part.indexOf(':');
    if (idx > 0) { const p = part.slice(0, idx).trim(), v = part.slice(idx + 1).trim(); if (p && v) decls[p] = v; }
  }
  return decls;
}

export function useFormatStyles({ initialFileIds }: UseFormatStylesOptions) {
  const isMultiFile = initialFileIds.length > 1;
  const [isCssOnlyMode, setIsCssOnlyMode] = useState(false);
  const [file, setFile] = useState<ManagedFile | null>(null);
  const [multiFiles, setMultiFiles] = useState<MultiFileInfo[]>([]);
  const [styles, setStyles] = useState("");
  const [originalStyles, setOriginalStyles] = useState("");
  const [lastSavedStyles, setLastSavedStyles] = useState("");
  const [parsed, setParsed] = useState<ParsedStylesheet>({ imports: [], rules: [] });
  const [inlineStyles, setInlineStyles] = useState<InlineStyleInfo[]>([]);
  const [selectorUsage, setSelectorUsage] = useState<SelectorUsage[]>([]);
  const [state, setState] = useState<StylesState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("visual");
  const [selectedSelector, setSelectedSelector] = useState<string | null>(null);
  const [multiEditMode, setMultiEditMode] = useState(false);
  const [multiEditSelection, setMultiEditSelection] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);

  const handleParsedUpdate = useCallback((np: ParsedStylesheet, ns: string) => { setParsed(np); setStyles(ns); }, []);
  const handleRawStylesUpdate = useCallback((u: (s: string) => string) => setStyles(u), []);
  
  const handleRawChange = useCallback((newStyles: string) => {
    setStyles(newStyles);
    const newParsed = parseCssRules(newStyles);
    if (newParsed) setParsed(newParsed);
  }, []);
  
  const updateStylesWithParse = useCallback((newStyles: string, autoSort = false) => {
    const finalStyles = autoSort ? sortAndFormatCss(newStyles) : newStyles;
    setStyles(finalStyles);
    const newParsed = parseCssRules(finalStyles);
    if (newParsed) setParsed(newParsed);
  }, []);
  
  const handleModeChange = useCallback((newMode: EditorMode) => {
    try {
      const sorted = sortAndFormatCss(styles);
      setStyles(sorted);
      const newParsed = parseCssRules(sorted);
      if (newParsed) setParsed(newParsed);
    } catch {
      const newParsed = parseCssRules(styles);
      if (newParsed) setParsed(newParsed);
    }
    if (mode === "raw" && newMode !== "raw") {
      setSelectedSelector(null);
    }
    setMode(newMode);
  }, [mode, styles]);
  
  const toggleMultiEditSelection = useCallback((selector: string) => {
    setMultiEditSelection(prev => {
      const next = new Set(prev);
      if (next.has(selector)) next.delete(selector); else next.add(selector);
      return next;
    });
  }, []);
  const clearMultiEditSelection = useCallback(() => setMultiEditSelection(new Set()), []);
  const toggleMultiEditMode = useCallback(() => {
    setMultiEditMode(prev => {
      if (prev) clearMultiEditSelection();
      return !prev;
    });
  }, [clearMultiEditSelection]);
  
  const { textareaRef, updateDeclaration, handleFontSelect } = useRuleEditor({
    selectedSelector, mode, parsed, multiEditSelection, onParsedUpdate: handleParsedUpdate, onRawStylesUpdate: handleRawStylesUpdate
  });

  const handleStylesUpdate = useCallback((ns: string, ni: InlineStyleInfo[], np?: ParsedStylesheet) => {
    setStyles(ns); setOriginalStyles(ns); setLastSavedStyles(ns); setInlineStyles(ni); if (np) setParsed(np);
  }, []);
  const handleMultiStylesUpdate = useCallback((ns: string, np?: ParsedStylesheet) => {
    setStyles(ns); setOriginalStyles(ns); setLastSavedStyles(ns); if (np) setParsed(np);
  }, []);
  const handleFilesUpdate = useCallback((files: ManagedFile[]) => {
    setMultiFiles(files.map(f => ({ id: f.id, name: f.name, size: f.size })));
    if (files.length > 0) setFile(files[0]);
  }, []);

  const singleApi = useStylesApi(file, styles, {
    onFileUpdate: setFile, onStylesUpdate: handleStylesUpdate, onStateChange: setState,
    onError: setError, onSelectorClear: () => setSelectedSelector(null),
  });
  const multiApi = useMultiStylesApi(multiFiles, styles, {
    onFilesUpdate: handleFilesUpdate, onStylesUpdate: handleMultiStylesUpdate, onStateChange: setState, onError: setError,
  });

  const editableRules: CssRule[] = useMemo(() => {
    const inlineRules = inlineStyles.map(i => ({ selector: i.selector, declarations: parseInlineStyle(i.style), editable: false }));
    return [...parsed.rules, ...inlineRules];
  }, [parsed, inlineStyles]);

  const selectedDeclarations = useMemo(() => {
    if (!selectedSelector) return {};
    const inl = inlineStyles.find(i => i.selector === selectedSelector);
    if (inl) return parseInlineStyle(inl.style);
    return parsed.rules.find(r => r.selector === selectedSelector)?.declarations || {};
  }, [parsed, selectedSelector, inlineStyles]);

  const multiEditDeclarations = useMemo(() => {
    if (multiEditSelection.size === 0) return {};
    const selectors = Array.from(multiEditSelection);
    const allDecls = selectors.map(sel => parsed.rules.find(r => r.selector === sel)?.declarations || {});
    if (allDecls.length === 0) return {};
    const merged: Record<string, string> = {};
    const allProps = new Set(allDecls.flatMap(d => Object.keys(d)));
    allProps.forEach(prop => {
      const values = allDecls.map(d => d[prop]).filter(Boolean);
      if (values.length === allDecls.length && values.every(v => v === values[0])) merged[prop] = values[0];
    });
    return merged;
  }, [parsed, multiEditSelection]);

  const loadFiles = useCallback(async () => {
    if (initialFileIds.length === 0) {
      setIsCssOnlyMode(true);
      setStyles(""); setOriginalStyles(""); setLastSavedStyles("");
      setParsed({ imports: [], rules: [] });
      setState("ready");
      return;
    }
    try {
      const allFiles = await listFiles();
      const selectedFiles = allFiles.filter(f => initialFileIds.includes(f.id));
      const hasCss = selectedFiles.some(f => isCssFile(f.name));
      const hasHtml = selectedFiles.some(f => isHtmlFile(f.name));
      const cssOnly = hasCss && !hasHtml;
      setIsCssOnlyMode(cssOnly);
      
      if (cssOnly && selectedFiles.length === 1) {
        const res = await getCssFileStyles(initialFileIds);
        setMultiFiles(res.files);
        const first = allFiles.find(f => f.id === res.files[0]?.id);
        if (first) setFile(first);
        const sorted = sortAndFormatCss(res.styles);
        setStyles(sorted); setOriginalStyles(sorted); setLastSavedStyles(sorted);
        const newParsed = parseCssRules(sorted);
        if (newParsed) setParsed(newParsed); else setParsed(res.parsed);
      } else if (isMultiFile || (hasCss && hasHtml)) {
        const res = await getMultiCssStyles(initialFileIds);
        setMultiFiles(res.files);
        const first = allFiles.find(f => f.id === res.files[0]?.id);
        if (first) setFile(first);
        const sorted = sortAndFormatCss(res.styles);
        setStyles(sorted); setOriginalStyles(sorted); setLastSavedStyles(sorted);
        const newParsed = parseCssRules(sorted);
        if (newParsed) setParsed(newParsed); else setParsed(res.parsed);
      } else {
        const sel = allFiles.find(f => f.id === initialFileIds[0]);
        if (!sel || !isHtmlFile(sel.name)) { setError("Invalid HTML file"); setState("error"); return; }
        setFile(sel);
        const res = await getCssStyles(initialFileIds[0]);
        const sorted = sortAndFormatCss(res.styles);
        setStyles(sorted); setOriginalStyles(sorted); setLastSavedStyles(sorted);
        const newParsed = parseCssRules(sorted);
        if (newParsed) setParsed(newParsed); else setParsed(res.parsed);
        setInlineStyles(res.inlineStyles || []); setSelectorUsage(res.selectorUsage || []);
      }
      setState("ready");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); setState("error"); }
  }, [initialFileIds, isMultiFile]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadFiles();
  }, [loadFiles]);

  const handleCssSave = useCallback(async () => {
    if (!isCssOnlyMode) return null;
    if (initialFileIds.length === 0) {
      setLastSavedStyles(styles); setOriginalStyles(styles);
      toast.info("No file to save. Use Download to get your stylesheet.");
      return styles;
    }
    setState("saving");
    try {
      await updateCssFileStyles(initialFileIds, styles);
      setState("ready");
      return styles;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setState("ready");
      return null;
    }
  }, [isCssOnlyMode, initialFileIds, styles]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (isCssOnlyMode) {
      const saved = await handleCssSave();
      if (saved) { setLastSavedStyles(saved); setOriginalStyles(saved); return true; }
      return false;
    }
    const saved = isMultiFile ? await multiApi.handleSave() : await singleApi.handleSave();
    if (saved) { setLastSavedStyles(saved); setOriginalStyles(saved); return true; }
    return false;
  }, [isCssOnlyMode, handleCssSave, isMultiFile, multiApi, singleApi]);
  const handleReset = useCallback(() => {
    setStyles(lastSavedStyles);
    const newParsed = parseCssRules(lastSavedStyles);
    if (newParsed) setParsed(newParsed);
  }, [lastSavedStyles]);
  const handleComplete = useCallback(() => setState("complete"), []);
  const hasChanges = styles !== originalStyles;
  const inlineCounts = useMemo(() => new Map(inlineStyles.map(i => [i.selector, i.count])), [inlineStyles]);
  const hasInlineStyles = inlineStyles.some(s => s.type === 'inline');
  const hasMultiClassStyles = inlineStyles.some(s => s.type === 'multiclass');
  const hasConsolidatableStyles = !isMultiFile && (hasInlineStyles || hasMultiClassStyles);
  const usageCounts = useMemo(() => new Map(selectorUsage.map(u => [u.selector, u.count])), [selectorUsage]);
  
  const handleLocalAddRule = useCallback((selector: string) => {
    const newRule = `${selector} {\n}\n`;
    const newStyles = styles.trim() + '\n\n' + newRule;
    updateStylesWithParse(newStyles, true);
  }, [styles, updateStylesWithParse]);
  
  const handleLocalAddRuleWithDeclarations = useCallback((selector: string, declarations: string) => {
    const formattedDecls = declarations.split(';').map(d => d.trim()).filter(Boolean).join(';\n  ');
    const newRule = `${selector} {\n  ${formattedDecls};\n}\n`;
    const newStyles = styles.trim() + '\n\n' + newRule;
    updateStylesWithParse(newStyles, true);
  }, [styles, updateStylesWithParse]);
  
  const handleLocalRemoveRule = useCallback((selector: string) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ruleRegex = new RegExp(`${escapedSelector}\\s*\\{[^}]*\\}\\s*`, 'g');
    let newStyles = styles.replace(ruleRegex, '').trim();
    newStyles = addInstructionComment(newStyles, { type: 'delete', selector });
    updateStylesWithParse(newStyles, true);
    setSelectedSelector(null);
  }, [styles, updateStylesWithParse]);
  const handleMergeStylesheet = useCallback(async (id: string) => {
    const m = await singleApi.handleMergeStylesheet(id); if (m !== null) updateStylesWithParse(m, true);
  }, [singleApi, updateStylesWithParse]);

  const handleLocalDownload = useCallback(() => {
    const blob = new Blob([styles], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file?.name || 'stylesheet.css';
    a.click();
    URL.revokeObjectURL(url);
  }, [styles, file]);

  return {
    file, multiFiles, isMultiFile, isCssOnlyMode, styles, setStyles, handleRawChange, selectedDeclarations, updateDeclaration, state, error,
    textareaRef, hasChanges, handleSave, handleReset, 
    handleDownload: isCssOnlyMode ? handleLocalDownload : (isMultiFile ? multiApi.handleDownload : singleApi.handleDownload),
    handleFontSelect, mode, handleModeChange, editableRules, selectedSelector, setSelectedSelector,
    inlineCounts, usageCounts, hasInlineStyles, hasMultiClassStyles, hasConsolidatableStyles,
    handleSimplify: singleApi.handleSimplify,
    handleRemoveRule: useCallback(async (selector: string) => {
      if (isCssOnlyMode) { handleLocalRemoveRule(selector); return; }
      const isSimple = selector.startsWith('.') && !selector.includes(' ') && !selector.includes(':') && selector.indexOf('.', 1) === -1;
      if (!isSimple) { toast.error("Only simple class selectors can be deleted in HTML mode"); return; }
      const className = selector.slice(1);
      if (isMultiFile) { await multiApi.handleRemoveClass(className); }
      else { await singleApi.handleRemoveClass(className); }
    }, [isCssOnlyMode, isMultiFile, handleLocalRemoveRule, singleApi, multiApi]),
    handleMergeStylesheet,
    handleAddRule: useCallback(async (selector: string) => {
      if (isCssOnlyMode) { handleLocalAddRule(selector); return; }
      const isSimple = selector.startsWith('.') && !selector.includes(' ') && !selector.includes(':') && selector.indexOf('.', 1) === -1;
      if (!isSimple) { handleLocalAddRule(selector); return; }
      const className = selector.slice(1);
      if (isMultiFile) { await multiApi.handleAddRule(className); }
      else { await singleApi.handleAddRule(className); }
    }, [isCssOnlyMode, isMultiFile, handleLocalAddRule, singleApi, multiApi]),
    handleAddRuleWithDeclarations: useCallback((selector: string, declarations: string) => {
      handleLocalAddRuleWithDeclarations(selector, declarations);
    }, [handleLocalAddRuleWithDeclarations]),
    handleReplaceClass: useCallback(async (source: string, target: string) => {
      if (isCssOnlyMode) {
        const escapedSelector = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const ruleRegex = new RegExp(`${escapedSelector}\\s*\\{[^}]*\\}\\s*`, 'g');
        let newStyles = styles.replace(ruleRegex, '').trim();
        newStyles = addInstructionComment(newStyles, { type: 'replace', selector: source, replacement: target });
        updateStylesWithParse(newStyles, true);
        return;
      }
      const isSimpleSrc = source.startsWith('.') && !source.includes(' ') && !source.includes(':') && source.indexOf('.', 1) === -1;
      const isSimpleTgt = target.startsWith('.') && !target.includes(' ') && !target.includes(':') && target.indexOf('.', 1) === -1;
      if (!isSimpleSrc || !isSimpleTgt) { toast.error("Only simple class selectors can be replaced in HTML mode"); return; }
      const srcClass = source.slice(1);
      const tgtClass = target.slice(1);
      if (isMultiFile) { await multiApi.handleReplaceClass(srcClass, tgtClass); }
      else { await singleApi.handleReplaceClass(srcClass, tgtClass); }
    }, [isCssOnlyMode, isMultiFile, styles, updateStylesWithParse, singleApi, multiApi]),
    multiEditMode, toggleMultiEditMode, multiEditSelection, toggleMultiEditSelection, clearMultiEditSelection, multiEditDeclarations,
  };
}
