import { DeclarationEditor } from "./DeclarationEditor";
import { StylePreview } from "./StylePreview";
import type { FontSelection } from "@/components/font-picker/FontPicker";

interface MultiEditPanelProps {
  selectors: string[];
  declarations: Record<string, string>;
  saving: boolean;
  onDeclarationChange: (property: string, value: string) => void;
  onFontSelect: (selection: FontSelection) => void;
}

export function MultiEditPanel({
  selectors,
  declarations,
  saving,
  onDeclarationChange,
  onFontSelect,
}: MultiEditPanelProps) {
  if (selectors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Multi-edit mode enabled.</p>
        <p className="text-sm mt-2">Select multiple selectors to edit them together.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 p-3 rounded bg-primary/10 border border-primary/20 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Editing {selectors.length} selectors
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectors.map((sel) => (
            <code key={sel} className="px-2 py-0.5 bg-background rounded text-xs font-mono border">{sel}</code>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Changes apply to all selected selectors. Only shared values are shown.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <DeclarationEditor
          declarations={declarations}
          onChange={onDeclarationChange}
          onFontSelect={onFontSelect}
          disabled={saving}
        />
      </div>
      <StylePreview selector={selectors.join(', ')} declarations={declarations} />
    </>
  );
}
