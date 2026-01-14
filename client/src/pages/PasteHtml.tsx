import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clipboard, FileText, X } from "lucide-react";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { PastedFileItem } from "@/components/files/PastedFileItem";
import { downloadFile } from "@/lib/file-manager/download-file";

export default function PasteHtml() {
  const [, setLocation] = useLocation();
  const [skipCss, setSkipCss] = useState(false);
  const { 
    state, 
    error, 
    files, 
    currentPreview,
    pasteFromClipboard, 
    clearPreview,
    removeFile,
    clearAll 
  } = useClipboardPaste();

  const handleDownload = (fileId: string) => {
    downloadFile(fileId);
  };

  const handlePaste = () => {
    pasteFromClipboard({ skipCss });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Files
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Paste HTML</h1>
          <p className="text-muted-foreground">
            Create XHTML files from clipboard content. Copy HTML from any source, 
            then click the button below to create a new file.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5" />
                  Paste from Clipboard
                </CardTitle>
                <CardDescription>
                  Copy HTML content, then click the button to create an XHTML file.
                  The filename will be inferred from the first heading or text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skip-css" 
                    checked={skipCss} 
                    onCheckedChange={(checked) => setSkipCss(checked === true)}
                    data-testid="checkbox-skip-css"
                  />
                  <Label htmlFor="skip-css" className="text-sm cursor-pointer">
                    Skip CSS styles (removes all formatting)
                  </Label>
                </div>

                <Button
                  onClick={handlePaste}
                  disabled={state === "processing"}
                  className="w-full"
                  size="lg"
                  data-testid="button-paste"
                >
                  <Clipboard className="mr-2 h-5 w-5" />
                  {state === "processing" ? "Processing..." : "Paste & Create File"}
                </Button>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm" data-testid="text-error">
                    {error}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Copy content from a webpage (Ctrl/Cmd+C)</li>
                    <li>Styles will be preserved when possible</li>
                    <li>Scripts and unsafe content are removed</li>
                    <li>Create multiple files without leaving this page</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {files.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Created Files ({files.length})</CardTitle>
                    <Button variant="ghost" size="sm" onClick={clearAll} data-testid="button-clear-all">
                      Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                      {files.map((file) => (
                        <PastedFileItem 
                          key={file.id} 
                          file={file} 
                          onDownload={handleDownload}
                          onRemove={removeFile}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="lg:sticky lg:top-4 h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Preview</CardTitle>
                {currentPreview && (
                  <Button variant="ghost" size="sm" onClick={clearPreview} data-testid="button-clear-preview">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentPreview ? (
                <ScrollArea className="h-96 rounded-md border p-4 bg-white">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentPreview }}
                    data-testid="preview-content"
                  />
                </ScrollArea>
              ) : (
                <div className="h-96 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Paste content to see a preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
