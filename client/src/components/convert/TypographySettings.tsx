import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TypographySettings as TypographySettingsType } from "@shared/contracts/settings";

interface Props {
  typography: TypographySettingsType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: <K extends keyof TypographySettingsType>(key: K, value: TypographySettingsType[K]) => void;
}

export function TypographySettings({ typography, open, onOpenChange, onUpdate }: Props) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="bg-card rounded-lg border">
        <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors" data-testid="button-typography-toggle">
          <h2 className="font-semibold">Typography Settings</h2>
          <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-6 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select value={typography.fontFamily} onValueChange={(v) => onUpdate('fontFamily', v as any)}>
                  <SelectTrigger id="fontFamily" data-testid="select-font-family"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif (Classic)</SelectItem>
                    <SelectItem value="sans-serif">Sans-Serif (Modern)</SelectItem>
                    <SelectItem value="georgia">Georgia</SelectItem>
                    <SelectItem value="times">Times New Roman</SelectItem>
                    <SelectItem value="palatino">Palatino</SelectItem>
                    <SelectItem value="arial">Arial</SelectItem>
                    <SelectItem value="helvetica">Helvetica</SelectItem>
                    <SelectItem value="verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textAlign">Text Alignment</Label>
                <Select value={typography.textAlign} onValueChange={(v) => onUpdate('textAlign', v as any)}>
                  <SelectTrigger id="textAlign" data-testid="select-text-align"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left Aligned</SelectItem>
                    <SelectItem value="justify">Justified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Size: {typography.fontSize}px</Label>
              <Slider value={[typography.fontSize]} onValueChange={([v]) => onUpdate('fontSize', v)} min={12} max={24} step={1} data-testid="slider-font-size" />
            </div>

            <div className="space-y-2">
              <Label>Line Height: {typography.lineHeight.toFixed(1)}</Label>
              <Slider value={[typography.lineHeight * 10]} onValueChange={([v]) => onUpdate('lineHeight', v / 10)} min={10} max={30} step={1} data-testid="slider-line-height" />
            </div>

            <div className="space-y-2">
              <Label>Paragraph Spacing: {typography.paragraphSpacing}em</Label>
              <Slider value={[typography.paragraphSpacing * 10]} onValueChange={([v]) => onUpdate('paragraphSpacing', v / 10)} min={0} max={30} step={1} data-testid="slider-paragraph-spacing" />
            </div>

            <div className="space-y-2">
              <Label>First Line Indent: {typography.firstLineIndent}em</Label>
              <Slider value={[typography.firstLineIndent * 10]} onValueChange={([v]) => onUpdate('firstLineIndent', v / 10)} min={0} max={40} step={5} data-testid="slider-first-line-indent" />
            </div>

            <div className="space-y-2">
              <Label>Page Margin: {typography.pageMargin}px</Label>
              <Slider value={[typography.pageMargin]} onValueChange={([v]) => onUpdate('pageMargin', v)} min={0} max={100} step={5} data-testid="slider-page-margin" />
            </div>

            <div className="space-y-2">
              <Label>Heading Size Multiplier: {typography.headingSize.toFixed(1)}x</Label>
              <Slider value={[typography.headingSize * 10]} onValueChange={([v]) => onUpdate('headingSize', v / 10)} min={10} max={30} step={1} data-testid="slider-heading-size" />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
