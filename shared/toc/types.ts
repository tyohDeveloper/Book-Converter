export interface TocEntry {
  id: string;
  label: string;
  level?: number;
}

export interface TocBuildOptions {
  title?: string;
  useXmlEscape?: boolean;
}
