import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Check, Loader2, Save } from "lucide-react";
import { DocumentOutline } from "@/components/DocumentOutline";
import { useViewRaw } from "@/hooks/useViewRaw";

export default function ViewRaw() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const fileId = params.get("file") || params.get("files")?.split(",")[0] || null;
  const fileName = params.get("name") || "File";
  
  const {
    content,
    editedContent,
    setEditedContent,
    loading,
    saving,
    error,
    hasChanges,
    prettyPrint,
    setPrettyPrint,
    displayContent,
    handleCopy,
    handleSave,
    textareaRef,
    handleOutlineNavigate,
  } = useViewRaw({ fileId });
  
  const [copied, setCopied] = useState(false);
  
  const onCopy = async () => {
    await handleCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHtml = fileName.toLowerCase().endsWith('.html') || 
                 fileName.toLowerCase().endsWith('.xhtml') ||
                 fileName.toLowerCase().endsWith('.htm');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Files
      </Button>

      {isHtml && fileId && !loading && (
        <DocumentOutline 
          fileId={fileId}
          onNavigate={handleOutlineNavigate}
          className="mb-4"
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle data-testid="text-title">{fileName}</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="pretty-print"
                checked={prettyPrint}
                onCheckedChange={setPrettyPrint}
                disabled={hasChanges}
                data-testid="switch-pretty-print"
              />
              <Label htmlFor="pretty-print" className="text-sm cursor-pointer">
                Pretty Print
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              disabled={!editedContent || loading}
              data-testid="button-copy"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving || loading}
              data-testid="button-save"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="text-loading">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          )}
          {error && (
            <p className="text-destructive" data-testid="text-error">
              {error}
            </p>
          )}
          {!loading && !error && (
            <textarea
              ref={textareaRef}
              className="w-full bg-muted p-4 rounded-md overflow-auto min-h-[70vh] text-sm font-mono whitespace-pre resize-y border-0 focus:outline-none focus:ring-2 focus:ring-ring"
              value={prettyPrint && !hasChanges ? displayContent : editedContent}
              onChange={(e) => {
                if (prettyPrint) setPrettyPrint(false);
                setEditedContent(e.target.value);
              }}
              spellCheck={false}
              data-testid="textarea-content"
            />
          )}
          {hasChanges && (
            <p className="text-sm text-amber-600 mt-2" data-testid="text-unsaved">
              You have unsaved changes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
