import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FontSelection } from "@/components/font-picker/FontPicker";
import { DocumentStyles } from "./style-types";
import { TypographySection } from "./TypographySection";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleEditorProps {
  styles: DocumentStyles;
  onChange: (styles: DocumentStyles) => void;
  onFontSelect: (selection: FontSelection) => void;
  disabled?: boolean;
}

export function StyleEditor({ styles, onChange, onFontSelect, disabled }: StyleEditorProps) {
  return (
    <div className="space-y-6" data-testid="style-editor">
      <TypographySection
        styles={styles.typography}
        onChange={(typography) => onChange({ ...styles, typography })}
        onFontSelect={onFontSelect}
        disabled={disabled}
      />

      {/* Colors Section */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={styles.colors.color || "#000000"}
                onChange={(e) => onChange({ ...styles, colors: { ...styles.colors, color: e.target.value } })}
                disabled={disabled}
                className="w-12 h-9 p-1 cursor-pointer"
                data-testid="input-text-color"
              />
              <Input
                value={styles.colors.color}
                onChange={(e) => onChange({ ...styles, colors: { ...styles.colors, color: e.target.value } })}
                disabled={disabled}
                placeholder="inherit"
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Background</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={styles.colors.backgroundColor || "#ffffff"}
                onChange={(e) => onChange({ ...styles, colors: { ...styles.colors, backgroundColor: e.target.value } })}
                disabled={disabled}
                className="w-12 h-9 p-1 cursor-pointer"
                data-testid="input-bg-color"
              />
              <Input
                value={styles.colors.backgroundColor}
                onChange={(e) => onChange({ ...styles, colors: { ...styles.colors, backgroundColor: e.target.value } })}
                disabled={disabled}
                placeholder="inherit"
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Text Alignment Section */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Text Alignment</h4>
        <div className="flex gap-1">
          {[
            { value: "left", icon: AlignLeft },
            { value: "center", icon: AlignCenter },
            { value: "right", icon: AlignRight },
            { value: "justify", icon: AlignJustify },
          ].map((align) => (
            <Button
              key={align.value}
              variant="outline"
              size="sm"
              className={cn(styles.text.textAlign === align.value && "bg-primary text-primary-foreground")}
              onClick={() => onChange({ ...styles, text: { ...styles.text, textAlign: align.value } })}
              disabled={disabled}
              data-testid={`button-align-${align.value}`}
            >
              <align.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </section>

      {/* Spacing Section */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spacing</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Padding (px)</Label>
            <Input
              type="number"
              value={styles.spacing.paddingTop ? parseInt(styles.spacing.paddingTop) : ""}
              onChange={(e) => {
                const num = parseInt(e.target.value) || 0;
                const v = `${Math.max(0, num)}px`;
                onChange({
                  ...styles,
                  spacing: { ...styles.spacing, paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v },
                });
              }}
              disabled={disabled}
              min={0}
              data-testid="input-padding"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Width</Label>
            <Select 
              value={styles.spacing.maxWidth || "none"} 
              onValueChange={(v) => onChange({ ...styles, spacing: { ...styles.spacing, maxWidth: v === "none" ? "" : v } })}
              disabled={disabled}
            >
              <SelectTrigger data-testid="select-max-width"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="600px">600px (Narrow)</SelectItem>
                <SelectItem value="800px">800px (Default)</SelectItem>
                <SelectItem value="1000px">1000px (Wide)</SelectItem>
                <SelectItem value="100%">100% (Full)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}
