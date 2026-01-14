import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { HtmlConversionSettings } from "@/hooks/useHtmlConversion";
import { BookStylesPanel } from "./BookStylesPanel";

interface Props {
  settings: HtmlConversionSettings;
  onUpdate: <K extends keyof HtmlConversionSettings>(key: K, value: HtmlConversionSettings[K]) => void;
}

export function HtmlSettingsPanel({ settings, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-6 space-y-6">
        <h2 className="font-semibold">Conversion Settings</h2>
        
        <BookStylesPanel
          value={settings.bookStylePreset}
          onChange={(preset) => onUpdate('bookStylePreset', preset)}
          disabled={settings.skipCss}
        />

        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="simpleExtraction" className="font-medium">Simple extraction mode</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Preserve natural paragraph structure from PDF. Skips text processing.
                </p>
              </div>
              <Switch
                id="simpleExtraction"
                checked={settings.simpleExtraction}
                onCheckedChange={(checked) => onUpdate('simpleExtraction', checked)}
                data-testid="switch-simple"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="preserveStyles" className="font-medium">Preserve text styles</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Detect and preserve italic and bold formatting. Works best with simple extraction.
                </p>
              </div>
              <Switch
                id="preserveStyles"
                checked={settings.preserveStyles}
                onCheckedChange={(checked) => {
                  onUpdate('preserveStyles', checked);
                  if (checked && !settings.simpleExtraction) {
                    onUpdate('simpleExtraction', true);
                  }
                }}
                data-testid="switch-preserve-styles"
              />
            </div>
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", settings.simpleExtraction && "opacity-50 pointer-events-none")}>
            <SettingSwitch label="Merge paragraphs" id="mergeParagraphs" checked={settings.mergeParagraphs} onChange={(v) => onUpdate('mergeParagraphs', v)} testId="switch-merge" />
            <SettingSwitch label="Remove page numbers" id="removePageNumbers" checked={settings.removePageNumbers} onChange={(v) => onUpdate('removePageNumbers', v)} testId="switch-pagenums" />
            <SettingSwitch label="Fix hyphenation" id="fixHyphenation" checked={settings.fixHyphenation} onChange={(v) => onUpdate('fixHyphenation', v)} testId="switch-hyphen" />
            <SettingSwitch label="Remove headers/footers" id="removeHeadersFooters" checked={settings.removeHeadersFooters} onChange={(v) => onUpdate('removeHeadersFooters', v)} testId="switch-headers" />
            <SettingSwitch label="Detect tables" id="detectTables" checked={settings.detectTables} onChange={(v) => onUpdate('detectTables', v)} testId="switch-tables" />
            <SettingSwitch label="Detect code blocks" id="detectCodeBlocks" checked={settings.detectCodeBlocks} onChange={(v) => onUpdate('detectCodeBlocks', v)} testId="switch-code" />
            <SettingSwitch label="Convert footnotes" id="convertFootnotes" checked={settings.convertFootnotes} onChange={(v) => onUpdate('convertFootnotes', v)} testId="switch-footnotes" />
            <SettingSwitch label="Preserve ToC indentation" id="preserveTOCIndentation" checked={settings.preserveTOCIndentation} onChange={(v) => onUpdate('preserveTOCIndentation', v)} testId="switch-toc" />
            <SettingSwitch label="Include Table of Contents" id="includeTableOfContents" checked={settings.includeTableOfContents} onChange={(v) => onUpdate('includeTableOfContents', v)} testId="switch-include-toc" />
            <SettingSwitch label="Skip CSS (raw content)" id="skipCss" checked={settings.skipCss} onChange={(v) => onUpdate('skipCss', v)} testId="switch-skip-css" />
          </div>

          {settings.mergeParagraphs && !settings.simpleExtraction && (
            <div className="space-y-2">
              <Label>Merge Sensitivity: {settings.sensitivity}%</Label>
              <Slider
                value={[settings.sensitivity]}
                onValueChange={([value]) => onUpdate('sensitivity', value)}
                min={0}
                max={100}
                step={5}
                data-testid="slider-sensitivity"
              />
              <p className="text-xs text-muted-foreground">Higher values merge more aggressively</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingSwitch({ label, id, checked, onChange, testId }: { label: string; id: string; checked: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} data-testid={testId} />
    </div>
  );
}
