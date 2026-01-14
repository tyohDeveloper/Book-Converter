import { Button } from "@/components/ui/button";
import { X, Edit3 } from "lucide-react";

interface VisualEditorHeaderProps {
  hasClassRules: boolean;
  saving: boolean;
  multiEditMode: boolean;
  multiEditCount: number;
  onToggleMultiEditMode: () => void;
  onClearMultiEditSelection: () => void;
}

export function VisualEditorHeader({
  hasClassRules,
  saving,
  multiEditMode,
  multiEditCount,
  onToggleMultiEditMode,
  onClearMultiEditSelection,
}: VisualEditorHeaderProps) {
  return (
    <div className="p-2 border-b flex-shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CSS Rules</h3>
        {hasClassRules && (
          <div className="flex gap-1">
            <Button
              variant={multiEditMode ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onToggleMultiEditMode}
              disabled={saving}
              title="Multi-Edit Mode"
              data-testid="button-toggle-multi-edit"
            >
              {multiEditMode ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            </Button>
          </div>
        )}
      </div>
      {multiEditMode && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Editing {multiEditCount} selectors
          </span>
          {multiEditCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onClearMultiEditSelection}
              disabled={saving}
              data-testid="button-clear-multi-edit"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
