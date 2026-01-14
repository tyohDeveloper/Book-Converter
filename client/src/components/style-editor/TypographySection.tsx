import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FontPicker, type FontSelection } from "@/components/font-picker/FontPicker";
import { TypographyStyles, FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS } from "./style-types";

interface TypographySectionProps {
  styles: TypographyStyles;
  onChange: (styles: TypographyStyles) => void;
  onFontSelect: (selection: FontSelection) => void;
  disabled?: boolean;
}

export function TypographySection({ styles, onChange, onFontSelect, disabled }: TypographySectionProps) {
  const update = (key: keyof TypographyStyles, value: string) => {
    onChange({ ...styles, [key]: value });
  };

  return (
    <section className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Typography</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Font Family</Label>
          <div className="flex gap-2">
            <Input
              value={styles.fontFamily}
              onChange={(e) => update("fontFamily", e.target.value)}
              disabled={disabled}
              className="flex-1"
              data-testid="input-font-family"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <FontPicker onSelect={onFontSelect} disabled={disabled} />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Font Size</Label>
          <Select value={styles.fontSize} onValueChange={(v) => update("fontSize", v)} disabled={disabled}>
            <SelectTrigger data-testid="select-font-size"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Font Weight</Label>
          <Select value={styles.fontWeight} onValueChange={(v) => update("fontWeight", v)} disabled={disabled}>
            <SelectTrigger data-testid="select-font-weight"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((w) => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Line Height</Label>
          <Select value={styles.lineHeight} onValueChange={(v) => update("lineHeight", v)} disabled={disabled}>
            <SelectTrigger data-testid="select-line-height"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LINE_HEIGHTS.map((lh) => <SelectItem key={lh.value} value={lh.value}>{lh.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={styles.fontStyle === "italic"}
            onCheckedChange={(checked) => update("fontStyle", checked ? "italic" : "normal")}
            disabled={disabled}
            data-testid="switch-italic"
          />
          <Label>Italic</Label>
        </div>
      </div>
    </section>
  );
}
