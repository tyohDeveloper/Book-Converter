import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors, Bold, Italic, Paintbrush } from "lucide-react";
import type { WrapKind } from "@/lib/file-manager/elements-api";

interface EditorToolbarProps {
  isApplying: boolean;
  wrapStyleInput: string;
  onWrapStyleChange: (value: string) => void;
  onSplit: () => void;
  onInsertBreak: () => void;
  onWrap: (kind: WrapKind) => void;
}

export function EditorToolbar({
  isApplying,
  wrapStyleInput,
  onWrapStyleChange,
  onSplit,
  onInsertBreak,
  onWrap,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-4 border-t pt-4">
      <div>
        <label className="text-xs text-muted-foreground block mb-2">Paragraph Operations</label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSplit} disabled={isApplying} data-testid="button-split">
            <Scissors className="h-4 w-4 mr-1" />Split Here
          </Button>
          <Button variant="outline" size="sm" onClick={onInsertBreak} disabled={isApplying} data-testid="button-break">
            Insert &lt;br/&gt;
          </Button>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-2">Wrap Selected Text</label>
        <div className="flex gap-2 items-end">
          <Button variant="outline" size="sm" onClick={() => onWrap("b")} disabled={isApplying} data-testid="button-bold">
            <Bold className="h-4 w-4 mr-1" />Bold
          </Button>
          <Button variant="outline" size="sm" onClick={() => onWrap("em")} disabled={isApplying} data-testid="button-italic">
            <Italic className="h-4 w-4 mr-1" />Italic
          </Button>
          <Input
            value={wrapStyleInput}
            onChange={(e) => onWrapStyleChange(e.target.value)}
            placeholder="color: red"
            className="w-28 h-9"
            disabled={isApplying}
            data-testid="input-wrap-style"
          />
          <Button variant="outline" size="sm" onClick={() => onWrap("span")} disabled={isApplying} data-testid="button-styled">
            <Paintbrush className="h-4 w-4 mr-1" />Styled
          </Button>
        </div>
      </div>
    </div>
  );
}
