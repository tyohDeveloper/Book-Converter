import { Link } from "wouter";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getToolsAvailable, type ToolAvailability, type ToolSection } from "@/lib/file-manager/tools-api";
import { 
  BookOpen, 
  Shrink, 
  Layers, 
  Combine,
  Code2,
  Bug,
  FileType,
  FileText,
  Scissors,
  FileOutput,
  ClipboardPaste,
  FileCode,
  Merge,
  Type,
  Palette,
  Eraser,
  type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Shrink,
  Layers,
  Combine,
  Code2,
  Bug,
  FileType,
  FileText,
  Scissors,
  FileOutput,
  ClipboardPaste,
  FileCode,
  Merge,
  Type,
  Palette,
  Eraser,
};

interface ToolsGridProps {
  selectedIds: Set<string>;
}

interface ToolCardProps {
  tool: ToolAvailability;
}

function ToolCard({ tool }: ToolCardProps) {
  const Icon = iconMap[tool.iconName] || FileText;

  const cardContent = (
    <div 
      className={cn(
        "group p-6 rounded-xl border bg-card transition-all",
        tool.enabled 
          ? "hover:border-primary hover:shadow-md cursor-pointer" 
          : "opacity-50 cursor-not-allowed"
      )}
      data-testid={`tool-${tool.id}`}
    >
      <div className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="font-serif text-lg font-bold mb-2">{tool.title}</h3>
      <p className="text-sm text-muted-foreground">{tool.description}</p>
      {tool.selectionMessage && (
        <p className={cn(
          "text-xs mt-2",
          tool.selectionMessage === "Select only 1 file" ? "text-amber-600" : "text-primary"
        )}>
          {tool.selectionMessage}
        </p>
      )}
    </div>
  );

  if (!tool.enabled) {
    return cardContent;
  }

  return <Link href={tool.link}>{cardContent}</Link>;
}

interface ToolSectionProps {
  section: ToolSection;
  sectionTitle: string;
  tools: ToolAvailability[];
}

function ToolSectionComponent({ section, sectionTitle, tools }: ToolSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="font-serif text-lg font-semibold text-muted-foreground mb-3">{sectionTitle}</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

export function ToolsGrid({ selectedIds }: ToolsGridProps) {
  const [tools, setTools] = useState<ToolAvailability[]>([]);
  const [sectionTitles, setSectionTitles] = useState<Record<ToolSection, string>>({
    html: "HTML Tools",
    pdf: "PDF Tools",
    epub: "EPUB Tools",
    docx: "DOCX Tools",
  });
  const selectedFileIds = Array.from(selectedIds);

  useEffect(() => {
    getToolsAvailable(selectedFileIds)
      .then((result) => {
        setTools(result.tools);
        setSectionTitles(result.sectionTitles);
      })
      .catch((err) => {
        console.error("Failed to get tools availability:", err);
      });
  }, [selectedFileIds.join(',')]);

  const sections: ToolSection[] = ["html", "pdf", "epub", "docx"];
  const toolsBySection = sections.map(section => ({
    section,
    sectionTitle: sectionTitles[section],
    tools: tools.filter(t => t.section === section),
  }));

  return (
    <div className="mb-8">
      {toolsBySection.map(({ section, sectionTitle, tools: sectionTools }) => (
        <ToolSectionComponent
          key={section}
          section={section}
          sectionTitle={sectionTitle}
          tools={sectionTools}
        />
      ))}
    </div>
  );
}
