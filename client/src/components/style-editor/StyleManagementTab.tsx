import { useState, useMemo } from "react";
import { Plus, Trash2, RefreshCw, AlertTriangle, Merge, ChevronDown, BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { uploadFiles } from "@/lib/file-manager/upload";
import { toast } from "sonner";
import type { CssRule } from "@/lib/file-manager/css/types";
import type { ManagedFile } from "@/lib/file-manager/types";

const PREDEFINED_PAGE_CLASSES: { name: string; selector: string; declarations: string; description: string }[] = [
  { name: "@page", selector: "@page", declarations: "margin: 1in; size: letter;", description: "Set page size and margins for PDF output" },
  { name: "Page Number", selector: ".page-number", declarations: "font-size: 10pt; text-align: center;", description: "Style for page number display" },
  { name: "Footnote", selector: ".footnote", declarations: "font-size: 9pt; orphans: 2; widows: 2;", description: "Smaller text for bottom-of-page notes" },
  { name: "Chapter Start", selector: ".chapter-start", declarations: "page-break-before: always; orphans: 3; widows: 3;", description: "Force new page at chapter beginning" },
  { name: "Keep Together", selector: ".keep-together", declarations: "page-break-inside: avoid;", description: "Keep element on one page (no splitting)" },
  { name: "No Break After", selector: ".no-break-after", declarations: "page-break-after: avoid;", description: "Keep with following content on same page" },
  { name: "No Break Before", selector: ".no-break-before", declarations: "page-break-before: avoid;", description: "Keep with preceding content on same page" },
];

interface StyleManagementTabProps {
  rules: CssRule[];
  saving: boolean;
  mergeableFiles: ManagedFile[];
  currentCss: string;
  onAddRule: (selector: string) => void;
  onAddRuleWithDeclarations?: (selector: string, declarations: string) => void;
  onDeleteRule: (selector: string) => void;
  onReplaceClass: (source: string, target: string) => void;
  onMergeStylesheet: (fileId: string) => void;
}


export function StyleManagementTab({
  rules, saving, mergeableFiles, currentCss,
  onAddRule, onAddRuleWithDeclarations, onDeleteRule, onReplaceClass,
  onMergeStylesheet,
}: StyleManagementTabProps) {
  const [newSelector, setNewSelector] = useState("");
  const [deleteSelector, setDeleteSelector] = useState("");
  const [sourceClass, setSourceClass] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [saveAsName, setSaveAsName] = useState("");
  const [savingFile, setSavingFile] = useState(false);

  const allSelectors = useMemo(() => rules.map(r => r.selector), [rules]);
  const existingSelectors = useMemo(() => new Set(rules.map(r => r.selector.toLowerCase())), [rules]);

  const handleAdd = () => {
    if (newSelector.trim()) {
      onAddRule(newSelector.trim());
      setNewSelector("");
    }
  };

  const handleDelete = () => {
    if (deleteSelector) {
      onDeleteRule(deleteSelector);
      setDeleteSelector("");
    }
  };

  const handleReplace = () => {
    if (sourceClass && targetClass && sourceClass !== targetClass) {
      onReplaceClass(sourceClass, targetClass);
      setSourceClass("");
      setTargetClass("");
    }
  };

  const handleAddPredefined = (preset: typeof PREDEFINED_PAGE_CLASSES[0]) => {
    if (onAddRuleWithDeclarations) {
      onAddRuleWithDeclarations(preset.selector, preset.declarations);
    } else {
      onAddRule(preset.selector);
    }
  };

  const handleSaveAsFile = async () => {
    const filename = saveAsName.trim() || "styles.css";
    const finalName = filename.endsWith(".css") ? filename : `${filename}.css`;
    setSavingFile(true);
    try {
      const blob = new Blob([currentCss], { type: "text/css" });
      const file = new File([blob], finalName, { type: "text/css" });
      await uploadFiles([file]);
      toast.success(`Saved as ${finalName}`);
      setSaveAsName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSavingFile(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" />Book Design Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {PREDEFINED_PAGE_CLASSES.map(preset => {
            const exists = existingSelectors.has(preset.selector.toLowerCase());
            return (
              <Button
                key={preset.selector}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-2"
                disabled={saving || exists}
                onClick={() => handleAddPredefined(preset)}
                title={exists ? "Already exists" : preset.declarations}
                data-testid={`button-add-preset-${preset.selector.replace(/[^a-z]/gi, '')}`}
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs truncate">{preset.selector}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{preset.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="h-4 w-4" />Add Style</h3>
        <div className="flex gap-2">
          <Input value={newSelector} onChange={e => setNewSelector(e.target.value)} placeholder=".my-class or h1" className="flex-1" disabled={saving} data-testid="input-new-selector" onKeyDown={e => e.key === 'Enter' && handleAdd()} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} />
          <Button onClick={handleAdd} disabled={saving || !newSelector.trim()} data-testid="button-add-rule"><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Trash2 className="h-4 w-4" />Delete Style</h3>
        <div className="flex gap-2">
          <Select value={deleteSelector} onValueChange={setDeleteSelector} disabled={saving || allSelectors.length === 0}>
            <SelectTrigger className="flex-1" data-testid="select-delete-selector"><SelectValue placeholder="Select style to delete" /></SelectTrigger>
            <SelectContent>{allSelectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="destructive" onClick={handleDelete} disabled={saving || !deleteSelector} data-testid="button-delete-rule"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
        </div>
        {deleteSelector && (
          <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />This will remove the style rule</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><RefreshCw className="h-4 w-4" />Replace Style</h3>
        <div className="flex gap-2">
          <Select value={sourceClass} onValueChange={setSourceClass} disabled={saving || allSelectors.length === 0}>
            <SelectTrigger className="flex-1" data-testid="select-source-selector"><SelectValue placeholder="Source style" /></SelectTrigger>
            <SelectContent>{allSelectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <span className="self-center text-muted-foreground">→</span>
          <Select value={targetClass} onValueChange={setTargetClass} disabled={saving || allSelectors.length === 0}>
            <SelectTrigger className="flex-1" data-testid="select-target-selector"><SelectValue placeholder="Target style" /></SelectTrigger>
            <SelectContent>{allSelectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={handleReplace} disabled={saving || !sourceClass || !targetClass || sourceClass === targetClass} data-testid="button-replace-selector"><RefreshCw className="h-4 w-4 mr-1" />Replace</Button>
        </div>
        {sourceClass && targetClass && sourceClass !== targetClass && (
          <p className="text-xs text-muted-foreground">Will replace all {sourceClass} references with {targetClass}</p>
        )}
      </section>

      <section className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Merge className="h-4 w-4" />Merge Styles</h3>
        <p className="text-xs text-muted-foreground">Merge styles from another file. Selected file takes priority over current styles.</p>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" disabled={saving || mergeableFiles.length === 0} data-testid="button-merge-stylesheet"><Merge className="h-4 w-4 mr-1" />Merge from File<ChevronDown className="h-3 w-3 ml-1" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>{mergeableFiles.map(f => <DropdownMenuItem key={f.id} onClick={() => onMergeStylesheet(f.id)} data-testid={`merge-file-${f.id}`}>{f.name}</DropdownMenuItem>)}{mergeableFiles.length === 0 && <DropdownMenuItem disabled>No files available</DropdownMenuItem>}</DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Save className="h-4 w-4" />Save as New File</h3>
        <p className="text-xs text-muted-foreground">Save current CSS as a new file in your file manager.</p>
        <div className="flex gap-2">
          <Input value={saveAsName} onChange={e => setSaveAsName(e.target.value)} placeholder="styles.css" className="flex-1" disabled={saving || savingFile} data-testid="input-save-as-name" onKeyDown={e => e.key === 'Enter' && handleSaveAsFile()} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} />
          <Button onClick={handleSaveAsFile} disabled={saving || savingFile || !currentCss.trim()} data-testid="button-save-as-file"><Save className="h-4 w-4 mr-1" />Save</Button>
        </div>
      </section>
    </div>
  );
}
