import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getHeaders } from "@/lib/session";
import { toast } from "sonner";

interface UseViewRawProps {
  fileId: string | null;
}

interface UseViewRawResult {
  content: string;
  editedContent: string;
  setEditedContent: (content: string) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasChanges: boolean;
  prettyPrint: boolean;
  setPrettyPrint: (value: boolean) => void;
  displayContent: string;
  handleCopy: () => Promise<void>;
  handleSave: () => Promise<void>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleOutlineNavigate: (id: string) => void;
}

function prettyPrintHtml(html: string): string {
  let formatted = "";
  let indent = 0;
  const tab = "  ";
  
  const tokens = html.replace(/>\s*</g, ">\n<").split("\n");
  
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith("</")) {
      indent = Math.max(0, indent - 1);
    }
    
    formatted += tab.repeat(indent) + trimmed + "\n";
    
    if (trimmed.startsWith("<") && 
        !trimmed.startsWith("</") && 
        !trimmed.startsWith("<?") &&
        !trimmed.startsWith("<!") &&
        !trimmed.endsWith("/>") &&
        !/<\/[^>]+>$/.test(trimmed)) {
      indent++;
    }
  }
  
  return formatted.trim();
}

export function useViewRaw({ fileId }: UseViewRawProps): UseViewRawResult {
  const [content, setContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prettyPrint, setPrettyPrint] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const hasChanges = content !== editedContent;
  
  const displayContent = useMemo(() => {
    if (!editedContent || !prettyPrint) return editedContent;
    return prettyPrintHtml(editedContent);
  }, [editedContent, prettyPrint]);

  useEffect(() => {
    // Reset state when fileId changes
    setContent("");
    setEditedContent("");
    setError(null);
    setLoading(true);
    
    if (!fileId) {
      setError("No file selected");
      setLoading(false);
      return;
    }

    async function fetchContent() {
      try {
        const response = await fetch(`/api/files/${fileId}/view`, {
          headers: getHeaders(),
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch file content");
        }
        
        const text = await response.text();
        setContent(text);
        setEditedContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [fileId]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(editedContent);
  }, [editedContent]);

  const handleSave = useCallback(async () => {
    if (!fileId || !hasChanges) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/files/${fileId}/content`, {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save file");
      }
      
      setContent(editedContent);
      toast.success("File saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  }, [fileId, hasChanges, editedContent]);
  
  const handleOutlineNavigate = useCallback((id: string) => {
    if (!textareaRef.current) return;
    const searchText = `id="${id}"`;
    const contentText = textareaRef.current.value || '';
    const index = contentText.indexOf(searchText);
    if (index >= 0) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + searchText.length);
      const lines = contentText.substring(0, index).split('\n').length - 1;
      const lineHeight = 20;
      textareaRef.current.scrollTop = lines * lineHeight;
    }
  }, []);

  return {
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
  };
}
