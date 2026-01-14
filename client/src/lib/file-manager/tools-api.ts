import { getHeaders } from '../session';

export type ToolSection = "html" | "pdf" | "epub" | "docx";

export interface ToolAvailability {
  id: string;
  path: string;
  iconName: string;
  title: string;
  description: string;
  section: ToolSection;
  requiresSingleFile?: boolean;
  enabled: boolean;
  selectedCount: number;
  link: string;
  selectionMessage: string | null;
}

export interface FileCounts {
  total: number;
  pdf: number;
  docx: number;
  epub: number;
  html: number;
}

export interface ToolsAvailableResult {
  tools: ToolAvailability[];
  counts: FileCounts;
  sectionTitles: Record<ToolSection, string>;
}

export async function getToolsAvailable(fileIds: string[]): Promise<ToolsAvailableResult> {
  const response = await fetch('/api/tools/available', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileIds })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get available tools' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
