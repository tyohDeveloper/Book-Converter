import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Loader2 } from "lucide-react";
import type { ElementTag, WrapKind } from "@/lib/file-manager/elements-api";
import { TAG_OPTIONS } from "./constants";
import { EditorToolbar } from "./EditorToolbar";
import { htmlPosToTextPos } from "./html-cursor-utils";

export interface ElementEditorProps {
  element: { index: number; tag: string; text: string; fullText?: string; innerHTML?: string; style?: string };
  isApplying: boolean;
  onClose: () => void;
  onChangeTag: (tag: ElementTag) => void;
  onAddStyle: (style: string) => void;
  onSplit: (position: number) => void;
  onInsertBreak: (position: number) => void;
  onWrap: (start: number, end: number, kind: WrapKind, style?: string) => void;
  onUpdateContent: (content: string) => void;
}

export function ElementEditor({
  element,
  isApplying,
  onClose,
  onChangeTag,
  onAddStyle,
  onSplit,
  onUpdateContent,
}: ElementEditorProps) {
  const [styleInput, setStyleInput] = useState("");
  const [wrapStyleInput, setWrapStyleInput] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [hasContentChanges, setHasContentChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const originalContent = element.innerHTML || element.fullText || element.text;

  useEffect(() => {
    setEditedContent(originalContent);
    setHasContentChanges(false);
  }, [originalContent]);

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasContentChanges(value !== originalContent);
  };

  const handleApplyContent = () => {
    if (hasContentChanges) {
      onUpdateContent(editedContent);
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedContent(originalContent);
    setHasContentChanges(false);
    onClose();
  };

  const handleAddStyle = () => {
    if (styleInput.trim()) {
      onAddStyle(styleInput.trim());
      setStyleInput("");
    }
  };

  const getSelection = () => {
    if (!textareaRef.current) return null;
    const { selectionStart, selectionEnd } = textareaRef.current;
    return { start: selectionStart, end: selectionEnd };
  };

  const handleSplit = () => {
    const sel = getSelection();
    if (sel && sel.start > 0) {
      const textPos = htmlPosToTextPos(editedContent, sel.start);
      if (textPos > 0) {
        if (hasContentChanges) {
          onUpdateContent(editedContent);
        }
        setTimeout(() => onSplit(textPos), 100);
      }
    }
  };

  const handleInsertBreak = () => {
    const sel = getSelection();
    if (sel) {
      const before = editedContent.substring(0, sel.start);
      const after = editedContent.substring(sel.start);
      setEditedContent(before + "<br/>" + after);
      setHasContentChanges(true);
    }
  };

  const handleWrap = (kind: WrapKind) => {
    const sel = getSelection();
    if (sel && sel.start < sel.end) {
      const before = editedContent.substring(0, sel.start);
      const selected = editedContent.substring(sel.start, sel.end);
      const after = editedContent.substring(sel.end);
      const styleAttr = kind === "span" && wrapStyleInput ? ` style="${wrapStyleInput}"` : "";
      setEditedContent(`${before}<${kind}${styleAttr}>${selected}</${kind}>${after}`);
      setHasContentChanges(true);
    }
  };

  return (
    <div className="rounded-lg border-2 border-primary bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Editing Element #{element.index + 1}</span>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={handleApplyContent} disabled={isApplying || !hasContentChanges} data-testid="button-apply">
            <Save className="h-4 w-4 mr-1" />Apply
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isApplying} data-testid="button-cancel">
            <X className="h-4 w-4 mr-1" />Cancel
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Element Type</label>
          <Select onValueChange={(v) => onChangeTag(v as ElementTag)} disabled={isApplying} defaultValue={element.tag}>
            <SelectTrigger className="w-36" data-testid="select-tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAG_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">Add Style</label>
          <div className="flex gap-2">
            <Input value={styleInput} onChange={(e) => setStyleInput(e.target.value)} placeholder="color: red; font-size: 18px" disabled={isApplying} data-testid="input-style" />
            <Button onClick={handleAddStyle} disabled={isApplying || !styleInput.trim()} data-testid="button-add-style">Add</Button>
          </div>
        </div>
      </div>

      {element.style && (
        <p className="text-xs text-muted-foreground">Current style: <code className="bg-muted px-1 rounded">{element.style}</code></p>
      )}

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">Content (HTML markup shown - edit text or select to format)</label>
        <textarea ref={textareaRef} value={editedContent} onChange={(e) => handleContentChange(e.target.value)} className="w-full min-h-40 p-3 text-sm font-mono bg-muted/50 border rounded-md resize-y" disabled={isApplying} data-testid="textarea-editor" />
        {hasContentChanges && <p className="text-xs text-amber-600">Unsaved changes - click Apply to save</p>}
      </div>

      <EditorToolbar
        isApplying={isApplying}
        wrapStyleInput={wrapStyleInput}
        onWrapStyleChange={setWrapStyleInput}
        onSplit={handleSplit}
        onInsertBreak={handleInsertBreak}
        onWrap={handleWrap}
      />

      {isApplying && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />Applying...
        </div>
      )}
    </div>
  );
}
