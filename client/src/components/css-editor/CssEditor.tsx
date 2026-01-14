import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, RotateCcw, Palette, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getCssStyles } from "@/lib/file-manager/css/get-css-styles";
import { updateCssStyles } from "@/lib/file-manager/css/update-css-styles";
import { withAsyncToast } from "@/lib/async-toast";

interface CssEditorProps {
  fileId: string;
  onFileUpdate?: (file: { id: string; name: string; size: number }) => void;
  disabled?: boolean;
}

export function CssEditor({ fileId, onFileUpdate, disabled }: CssEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [styles, setStyles] = useState("");
  const [originalStyles, setOriginalStyles] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadStyles = useCallback(async () => {
    if (!fileId) return;
    setIsLoading(true);
    try {
      const result = await getCssStyles(fileId);
      setStyles(result.styles);
      setOriginalStyles(result.styles);
    } catch (err) {
      console.error("Failed to load CSS:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    if (isOpen && !styles && !isLoading) {
      loadStyles();
    }
  }, [isOpen, styles, isLoading, loadStyles]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await withAsyncToast(
        () => updateCssStyles(fileId, styles),
        {
          loading: "Saving styles...",
          success: "Styles saved!",
          error: (err) => err.message || "Failed to save"
        }
      );
      if (result.file) {
        setOriginalStyles(styles);
        onFileUpdate?.(result.file);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStyles(originalStyles);
  };

  const hasChanges = styles !== originalStyles;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/30 transition-colors"
          data-testid="button-toggle-css-editor"
        >
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <span className="font-medium">Document Styles (CSS)</span>
              <p className="text-xs text-muted-foreground">Edit fonts, colors, spacing</p>
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading styles...</span>
            </div>
          ) : (
            <>
              <Textarea
                value={styles}
                onChange={(e) => setStyles(e.target.value)}
                placeholder="body { font-family: serif; }"
                className="font-mono text-sm min-h-[200px] resize-y"
                disabled={disabled || isSaving}
                data-testid="textarea-css-editor"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={disabled || isSaving || !hasChanges}
                  data-testid="button-save-css"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Styles
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={disabled || isSaving || !hasChanges}
                  data-testid="button-reset-css"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
