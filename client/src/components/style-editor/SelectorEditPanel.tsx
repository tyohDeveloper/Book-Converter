import { DeclarationEditor } from "./DeclarationEditor";
import { StylePreview } from "./StylePreview";
import type { FontSelection } from "@/components/font-picker/FontPicker";

interface SelectorEditPanelProps {
  selector: string;
  declarations: Record<string, string>;
  saving: boolean;
  onDeclarationChange: (property: string, value: string) => void;
  onFontSelect: (selection: FontSelection) => void;
}

export function SelectorEditPanel({
  selector,
  declarations,
  saving,
  onDeclarationChange,
  onFontSelect,
}: SelectorEditPanelProps) {
  return (
    <>
      <div className="mb-4 p-2 rounded bg-muted/50 flex items-center justify-between flex-shrink-0">
        <div>
          <span className="text-xs text-muted-foreground">Editing: </span>
          <code className="font-mono text-sm font-medium">{selector}</code>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <DeclarationEditor
          declarations={declarations}
          onChange={onDeclarationChange}
          onFontSelect={onFontSelect}
          disabled={saving}
        />
      </div>
      <StylePreview selector={selector} declarations={declarations} />
    </>
  );
}
