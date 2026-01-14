import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Code2, FileText } from "lucide-react";

export type OutputFormat = "html" | "epub" | "pdf";

export interface DocxSettings {
  outputFormat: OutputFormat;
  title: string;
  author: string;
  includeTableOfContents: boolean;
}

interface DocxSettingsFormProps {
  settings: DocxSettings;
  onSettingsChange: <K extends keyof DocxSettings>(key: K, value: DocxSettings[K]) => void;
  disablePdf?: boolean;
}

export function DocxSettingsForm({ settings, onSettingsChange, disablePdf }: DocxSettingsFormProps) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversion Settings</h3>
      
      <div className="space-y-4">
        <Label className="text-base font-medium">Output Format</Label>
        <RadioGroup 
          value={settings.outputFormat} 
          onValueChange={(v) => onSettingsChange('outputFormat', v as OutputFormat)} 
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="html" id="format-html" data-testid="radio-html" />
            <Label htmlFor="format-html" className="flex items-center gap-2 cursor-pointer">
              <Code2 className="h-4 w-4" />
              HTML
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="epub" id="format-epub" data-testid="radio-epub" />
            <Label htmlFor="format-epub" className="flex items-center gap-2 cursor-pointer">
              <BookOpen className="h-4 w-4" />
              EPUB
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="pdf" 
              id="format-pdf" 
              data-testid="radio-pdf"
              disabled={disablePdf}
            />
            <Label 
              htmlFor="format-pdf" 
              className={`flex items-center gap-2 cursor-pointer ${disablePdf ? 'opacity-50' : ''}`}
            >
              <FileText className="h-4 w-4" />
              PDF {disablePdf && "(single file only)"}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={settings.title}
            onChange={(e) => onSettingsChange('title', e.target.value)}
            placeholder="Document title"
            data-testid="input-title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={settings.author}
            onChange={(e) => onSettingsChange('author', e.target.value)}
            placeholder="Author name"
            data-testid="input-author"
          />
        </div>
      </div>

      {settings.outputFormat !== 'pdf' && (
        <div className="flex items-center justify-between">
          <Label htmlFor="toc" className="cursor-pointer">Include Table of Contents</Label>
          <Switch
            id="toc"
            checked={settings.includeTableOfContents}
            onCheckedChange={(v) => onSettingsChange('includeTableOfContents', v)}
            data-testid="switch-toc"
          />
        </div>
      )}
    </div>
  );
}
