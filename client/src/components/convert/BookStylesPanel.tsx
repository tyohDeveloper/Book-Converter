import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookStylePreset {
  id: string;
  name: string;
  bodyFontFamily: string;
  bodyFontSize: number;
  lineHeight: number;
  headingFontFamily: string;
  headingScale: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
  tocStyle: { titleSize: number; entrySize: number; showDivider: boolean };
  paragraphSpacing: number;
  firstLineIndent: number;
}

interface Props {
  value?: BookStylePreset;
  onChange: (preset: BookStylePreset | undefined) => void;
  disabled?: boolean;
}

const FONT_OPTIONS = [
  { value: "serif", label: "Serif (Default)" },
  { value: "georgia", label: "Georgia" },
  { value: "times", label: "Times New Roman" },
  { value: "palatino", label: "Palatino" },
  { value: "sans-serif", label: "Sans-Serif" },
  { value: "arial", label: "Arial" },
  { value: "helvetica", label: "Helvetica" },
  { value: "verdana", label: "Verdana" },
];

export function BookStylesPanel({ value, onChange, disabled }: Props) {
  const [presets, setPresets] = useState<BookStylePreset[]>([]);
  const [enabled, setEnabled] = useState(!!value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/styles/presets")
      .then(res => res.json())
      .then(data => setPresets(data.presets || []))
      .catch(() => {});
  }, []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked && presets.length > 0 && !value) {
      onChange(presets[0]);
    } else if (!checked) {
      onChange(undefined);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onChange({ ...preset });
    }
  };

  const handleCustomChange = <K extends keyof BookStylePreset>(key: K, val: BookStylePreset[K]) => {
    if (!value) return;
    onChange({ ...value, [key]: val });
  };

  return (
    <div className={cn("bg-card rounded-lg border p-4 space-y-4", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <Label className="font-semibold">Book Styling</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          data-testid="switch-book-styles"
        />
      </div>

      {enabled && value && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Style Preset</Label>
            <Select value={value.id} onValueChange={handlePresetSelect}>
              <SelectTrigger data-testid="select-preset">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full">
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              Customize
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select value={value.bodyFontFamily} onValueChange={v => handleCustomChange("bodyFontFamily", v as BookStylePreset["bodyFontFamily"])}>
                    <SelectTrigger data-testid="select-body-font">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select value={value.headingFontFamily} onValueChange={v => handleCustomChange("headingFontFamily", v as BookStylePreset["headingFontFamily"])}>
                    <SelectTrigger data-testid="select-heading-font">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Body Font Size: {value.bodyFontSize}px</Label>
                <Slider
                  value={[value.bodyFontSize]}
                  onValueChange={([v]) => handleCustomChange("bodyFontSize", v)}
                  min={12}
                  max={24}
                  step={1}
                  data-testid="slider-font-size"
                />
              </div>

              <div className="space-y-2">
                <Label>Line Height: {value.lineHeight.toFixed(1)}</Label>
                <Slider
                  value={[value.lineHeight * 10]}
                  onValueChange={([v]) => handleCustomChange("lineHeight", v / 10)}
                  min={12}
                  max={25}
                  step={1}
                  data-testid="slider-line-height"
                />
              </div>

              <div className="space-y-2">
                <Label>Paragraph Spacing: {value.paragraphSpacing.toFixed(1)}em</Label>
                <Slider
                  value={[value.paragraphSpacing * 10]}
                  onValueChange={([v]) => handleCustomChange("paragraphSpacing", v / 10)}
                  min={0}
                  max={20}
                  step={1}
                  data-testid="slider-paragraph-spacing"
                />
              </div>

              <div className="space-y-2">
                <Label>First Line Indent: {value.firstLineIndent.toFixed(1)}em</Label>
                <Slider
                  value={[value.firstLineIndent * 10]}
                  onValueChange={([v]) => handleCustomChange("firstLineIndent", v / 10)}
                  min={0}
                  max={30}
                  step={1}
                  data-testid="slider-first-line-indent"
                />
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-medium mb-2 block">Heading Sizes</Label>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {(["h1", "h2", "h3"] as const).map(h => (
                    <div key={h} className="space-y-1">
                      <Label className="text-xs uppercase">{h}: {value.headingScale[h].toFixed(1)}em</Label>
                      <Slider
                        value={[value.headingScale[h] * 10]}
                        onValueChange={([v]) => handleCustomChange("headingScale", { ...value.headingScale, [h]: v / 10 })}
                        min={10}
                        max={35}
                        step={1}
                        data-testid={`slider-${h}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-medium mb-2 block">Table of Contents</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Title Size: {value.tocStyle.titleSize.toFixed(1)}em</Label>
                    <Slider
                      value={[value.tocStyle.titleSize * 10]}
                      onValueChange={([v]) => handleCustomChange("tocStyle", { ...value.tocStyle, titleSize: v / 10 })}
                      min={10}
                      max={30}
                      step={1}
                      data-testid="slider-toc-title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Entry Size: {value.tocStyle.entrySize.toFixed(1)}em</Label>
                    <Slider
                      value={[value.tocStyle.entrySize * 10]}
                      onValueChange={([v]) => handleCustomChange("tocStyle", { ...value.tocStyle, entrySize: v / 10 })}
                      min={8}
                      max={15}
                      step={1}
                      data-testid="slider-toc-entry"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Label className="text-xs">Show Divider</Label>
                  <Switch
                    checked={value.tocStyle.showDivider}
                    onCheckedChange={v => handleCustomChange("tocStyle", { ...value.tocStyle, showDivider: v })}
                    data-testid="switch-toc-divider"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
