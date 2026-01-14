import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getHeaders } from "@/lib/session";

interface OutlineItem {
  id: string | null;
  text: string;
  level: number;
}

interface DocumentOutlineProps {
  htmlContent?: string;
  fileId?: string;
  onNavigate?: (id: string) => void;
  className?: string;
}

async function fetchOutline(htmlContent?: string, fileId?: string): Promise<OutlineItem[]> {
  const body: Record<string, string> = {};
  if (fileId) {
    body.fileId = fileId;
  } else if (htmlContent) {
    body.html = htmlContent;
  } else {
    return [];
  }

  const response = await fetch('/api/html/outline', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    console.error('Failed to fetch outline');
    return [];
  }

  const result = await response.json();
  return result.outline || [];
}

export function DocumentOutline({ htmlContent, fileId, onNavigate, className }: DocumentOutlineProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!htmlContent && !fileId) {
      setOutline([]);
      return;
    }

    setLoading(true);
    fetchOutline(htmlContent, fileId)
      .then(setOutline)
      .finally(() => setLoading(false));
  }, [htmlContent, fileId]);

  if (loading) {
    return (
      <div className={cn("border rounded-lg bg-card p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <List className="h-4 w-4 animate-pulse" />
          <span>Loading outline...</span>
        </div>
      </div>
    );
  }

  if (outline.length === 0) {
    return null;
  }

  const minLevel = Math.min(...outline.map(item => item.level));

  const handleClick = (item: OutlineItem) => {
    if (item.id) {
      setActiveId(item.id);
      onNavigate?.(item.id);
    }
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Document Outline</span>
          <span className="text-xs text-muted-foreground">({outline.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 p-0"
          data-testid="button-toggle-outline"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        <ScrollArea className="max-h-[300px]">
          <nav className="p-2" data-testid="outline-nav">
            {outline.map((item, index) => (
              <button
                key={`${item.id ?? 'no-id'}-${index}`}
                onClick={() => handleClick(item)}
                disabled={!item.id}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-sm transition-colors truncate block",
                  item.id ? "hover:bg-muted cursor-pointer" : "text-muted-foreground cursor-default",
                  activeId === item.id && item.id && "bg-primary/10 text-primary",
                )}
                style={{ paddingLeft: `${(item.level - minLevel) * 12 + 8}px` }}
                data-testid={`outline-item-${index}`}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </ScrollArea>
      )}
    </div>
  );
}
