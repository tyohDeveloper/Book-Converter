import { Navbar } from "@/components/Navbar";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Download, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEpubConversion } from "@/hooks/useEpubConversion";

export default function Convert() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const filesParam = params.get('files');
  const initialFileIds = filesParam ? filesParam.split(',') : [];

  const {
    htmlFile,
    state,
    error,
    settings,
    updateSettings,
    handleConvert,
  } = useEpubConversion({ initialFileIds });

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              The EPUB converter accepts HTML files that have been created by the HTML converter.
            </p>
            <Link href="/"><Button variant="outline">Back to Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r bg-card flex flex-col overflow-hidden z-20 shadow-sm">
          <div className="p-6 border-b">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Files
              </Button>
            </Link>
            <h2 className="font-serif text-2xl font-bold text-primary">Convert HTML to EPUB</h2>
            <p className="text-xs text-muted-foreground mt-1">HTML → EPUB</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Source File
              </h3>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm font-medium truncate" data-testid="text-source-file">
                  {htmlFile?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {htmlFile?.size ? `${(htmlFile.size / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                EPUB Settings
              </h3>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={settings.title || ''}
                  onChange={(e) => updateSettings({ title: e.target.value })}
                  placeholder="Book title"
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={settings.author || ''}
                  onChange={(e) => updateSettings({ author: e.target.value })}
                  placeholder="Author name"
                  data-testid="input-author"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compression">Compression</Label>
                <Select
                  value={settings.compressionLevel}
                  onValueChange={(value: 'fast' | 'maximum') => updateSettings({ compressionLevel: value })}
                >
                  <SelectTrigger id="compression" data-testid="select-compression">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (larger file)</SelectItem>
                    <SelectItem value="maximum">Maximum (smaller file)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <BookOpen className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-primary mb-2">Ready to Convert</h2>
              <p className="text-muted-foreground mb-6">
                Convert your HTML file to EPUB format. The HTML content will be split into chapters
                and packaged as a valid EPUB file.
              </p>

              <Button
                onClick={handleConvert}
                disabled={state === "converting" || !htmlFile}
                size="lg"
                className="gap-2"
                data-testid="button-convert"
              >
                {state === "converting" ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />Converting...</>
                ) : (
                  <><Download className="h-5 w-5" />Generate EPUB</>
                )}
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
