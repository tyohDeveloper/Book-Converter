import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FontPicker, type FontSelection } from "@/components/font-picker/FontPicker";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeclarationEditorProps {
  declarations: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onFontSelect: (selection: FontSelection) => void;
  disabled?: boolean;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];
const LINE_HEIGHTS = [
  { value: "", label: "Default" },
  { value: "1", label: "1.0 (Tight)" },
  { value: "1.4", label: "1.4" },
  { value: "1.6", label: "1.6" },
  { value: "1.8", label: "1.8" },
  { value: "2", label: "2.0 (Double)" },
];

export function DeclarationEditor({ declarations, onChange, onFontSelect, disabled }: DeclarationEditorProps) {
  const get = (prop: string) => declarations[prop] || "";
  
  return (
    <div className="space-y-6" data-testid="declaration-editor">
      {/* Typography */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Typography</h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Font Family</Label>
            <div className="flex gap-2">
              <Input
                value={get("font-family")}
                onChange={(e) => onChange("font-family", e.target.value)}
                placeholder="inherit"
                disabled={disabled}
                className="flex-1 font-mono text-sm"
                data-testid="input-font-family"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <FontPicker onSelect={onFontSelect} disabled={disabled} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select value={get("font-size") || "none"} onValueChange={(v) => onChange("font-size", v === "none" ? "" : v)} disabled={disabled}>
                <SelectTrigger data-testid="select-font-size"><SelectValue placeholder="Default" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  {FONT_SIZES.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Line Height</Label>
              <Select value={get("line-height") || "none"} onValueChange={(v) => onChange("line-height", v === "none" ? "" : v)} disabled={disabled}>
                <SelectTrigger data-testid="select-line-height"><SelectValue placeholder="Default" /></SelectTrigger>
                <SelectContent>
                  {LINE_HEIGHTS.map(lh => <SelectItem key={lh.value || "none"} value={lh.value || "none"}>{lh.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select value={get("font-weight") || "none"} onValueChange={(v) => onChange("font-weight", v === "none" ? "" : v)} disabled={disabled}>
                <SelectTrigger data-testid="select-font-weight"><SelectValue placeholder="Default" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="lighter">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Font Style</Label>
              <Select value={get("font-style") || "none"} onValueChange={(v) => onChange("font-style", v === "none" ? "" : v)} disabled={disabled}>
                <SelectTrigger data-testid="select-font-style"><SelectValue placeholder="Default" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              {get("color") ? (
                <Input
                  type="color"
                  value={get("color")}
                  onChange={(e) => onChange("color", e.target.value)}
                  disabled={disabled}
                  className="w-12 h-9 p-1 cursor-pointer"
                  data-testid="input-text-color"
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-12 h-9"
                  onClick={() => onChange("color", "#333333")}
                  disabled={disabled}
                  data-testid="button-add-text-color"
                >
                  <span className="text-xs">+</span>
                </Button>
              )}
              <Input
                value={get("color")}
                onChange={(e) => onChange("color", e.target.value)}
                disabled={disabled}
                placeholder="inherit"
                className="flex-1 font-mono text-sm"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Background</Label>
            <div className="flex gap-2">
              {get("background-color") ? (
                <Input
                  type="color"
                  value={get("background-color")}
                  onChange={(e) => onChange("background-color", e.target.value)}
                  disabled={disabled}
                  className="w-12 h-9 p-1 cursor-pointer"
                  data-testid="input-bg-color"
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-12 h-9"
                  onClick={() => onChange("background-color", "#ffffff")}
                  disabled={disabled}
                  data-testid="button-add-bg-color"
                >
                  <span className="text-xs">+</span>
                </Button>
              )}
              <Input
                value={get("background-color")}
                onChange={(e) => onChange("background-color", e.target.value)}
                disabled={disabled}
                placeholder="inherit"
                className="flex-1 font-mono text-sm"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Text Alignment */}
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
              className={cn(get("text-align") === align.value && "bg-primary text-primary-foreground")}
              onClick={() => onChange("text-align", get("text-align") === align.value ? "" : align.value)}
              disabled={disabled}
              data-testid={`button-align-${align.value}`}
            >
              <align.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </section>

      {/* Spacing */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spacing</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Padding</Label>
            <Input
              value={get("padding")}
              onChange={(e) => onChange("padding", e.target.value)}
              placeholder="e.g., 20px or 10px 20px"
              disabled={disabled}
              className="font-mono text-sm"
              data-testid="input-padding"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <Label>Margin</Label>
            <Input
              value={get("margin")}
              onChange={(e) => onChange("margin", e.target.value)}
              placeholder="e.g., 0 auto"
              disabled={disabled}
              className="font-mono text-sm"
              data-testid="input-margin"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Max Width</Label>
          <Select value={get("max-width") || "none"} onValueChange={(v) => onChange("max-width", v === "none" ? "" : v)} disabled={disabled}>
            <SelectTrigger data-testid="select-max-width"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="600px">600px (Narrow)</SelectItem>
              <SelectItem value="800px">800px (Default)</SelectItem>
              <SelectItem value="1000px">1000px (Wide)</SelectItem>
              <SelectItem value="100%">100% (Full)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Text & Whitespace */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Text & Whitespace</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Text Indent</Label>
            <Input
              value={get("text-indent")}
              onChange={(e) => onChange("text-indent", e.target.value)}
              placeholder="e.g., 2em or 20px"
              disabled={disabled}
              className="font-mono text-sm"
              data-testid="input-text-indent"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <Label>Letter Spacing</Label>
            <Input
              value={get("letter-spacing")}
              onChange={(e) => onChange("letter-spacing", e.target.value)}
              placeholder="e.g., 0.05em"
              disabled={disabled}
              className="font-mono text-sm"
              data-testid="input-letter-spacing"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>White Space</Label>
            <Select value={get("white-space") || "none"} onValueChange={(v) => onChange("white-space", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-white-space"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="nowrap">No Wrap</SelectItem>
                <SelectItem value="pre">Pre (preserve)</SelectItem>
                <SelectItem value="pre-wrap">Pre-wrap</SelectItem>
                <SelectItem value="pre-line">Pre-line</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Word Break</Label>
            <Select value={get("word-break") || "none"} onValueChange={(v) => onChange("word-break", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-word-break"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="break-all">Break All</SelectItem>
                <SelectItem value="keep-all">Keep All</SelectItem>
                <SelectItem value="break-word">Break Word</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Text Transform</Label>
            <Select value={get("text-transform") || "none"} onValueChange={(v) => onChange("text-transform", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-text-transform"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="capitalize">Capitalize</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Overflow Wrap</Label>
            <Select value={get("overflow-wrap") || "none"} onValueChange={(v) => onChange("overflow-wrap", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-overflow-wrap"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="break-word">Break Word</SelectItem>
                <SelectItem value="anywhere">Anywhere</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Page Break & Print */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Page Break & Print</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Page Break Before</Label>
            <Select value={get("page-break-before") || "none"} onValueChange={(v) => onChange("page-break-before", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-page-break-before"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="avoid">Avoid</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Page Break After</Label>
            <Select value={get("page-break-after") || "none"} onValueChange={(v) => onChange("page-break-after", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-page-break-after"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="avoid">Avoid</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Page Break Inside</Label>
            <Select value={get("page-break-inside") || "none"} onValueChange={(v) => onChange("page-break-inside", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-page-break-inside"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="avoid">Avoid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Orphans</Label>
            <Select value={get("orphans") || "none"} onValueChange={(v) => onChange("orphans", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-orphans"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="2">2 lines</SelectItem>
                <SelectItem value="3">3 lines</SelectItem>
                <SelectItem value="4">4 lines</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Widows</Label>
            <Select value={get("widows") || "none"} onValueChange={(v) => onChange("widows", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-widows"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="2">2 lines</SelectItem>
                <SelectItem value="3">3 lines</SelectItem>
                <SelectItem value="4">4 lines</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hyphens</Label>
            <Select value={get("hyphens") || "none"} onValueChange={(v) => onChange("hyphens", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-hyphens"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (no hyphenation)</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="manual">Manual only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Borders */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Borders</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Border Width</Label>
            <Input
              value={get("border-width")}
              onChange={(e) => onChange("border-width", e.target.value)}
              placeholder="e.g., 1px"
              disabled={disabled}
              className="font-mono text-sm"
              data-testid="input-border-width"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <Label>Border Style</Label>
            <Select value={get("border-style") || "none"} onValueChange={(v) => onChange("border-style", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-border-style"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Border Color</Label>
            <div className="flex gap-2">
              {get("border-color") ? (
                <Input
                  type="color"
                  value={get("border-color")}
                  onChange={(e) => onChange("border-color", e.target.value)}
                  disabled={disabled}
                  className="w-12 h-9 p-1 cursor-pointer"
                  data-testid="input-border-color"
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-12 h-9"
                  onClick={() => onChange("border-color", "#cccccc")}
                  disabled={disabled}
                  data-testid="button-add-border-color"
                >
                  <span className="text-xs">+</span>
                </Button>
              )}
              <Input
                value={get("border-color")}
                onChange={(e) => onChange("border-color", e.target.value)}
                disabled={disabled}
                placeholder="inherit"
                className="flex-1 font-mono text-sm"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Border Radius</Label>
          <Input
            value={get("border-radius")}
            onChange={(e) => onChange("border-radius", e.target.value)}
            placeholder="e.g., 4px or 50%"
            disabled={disabled}
            className="font-mono text-sm"
            data-testid="input-border-radius"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </section>

      {/* Display & Layout */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Display & Layout</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Display</Label>
            <Select value={get("display") || "none"} onValueChange={(v) => onChange("display", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-display"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="inline">Inline</SelectItem>
                <SelectItem value="inline-block">Inline Block</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={get("visibility") || "none"} onValueChange={(v) => onChange("visibility", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-visibility"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vertical Align</Label>
            <Select value={get("vertical-align") || "none"} onValueChange={(v) => onChange("vertical-align", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-vertical-align"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="baseline">Baseline</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="text-top">Text Top</SelectItem>
                <SelectItem value="text-bottom">Text Bottom</SelectItem>
                <SelectItem value="super">Super</SelectItem>
                <SelectItem value="sub">Sub</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Float</Label>
            <Select value={get("float") || "none"} onValueChange={(v) => onChange("float", v === "none" ? "" : v)} disabled={disabled}>
              <SelectTrigger data-testid="select-float"><SelectValue placeholder="Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}
