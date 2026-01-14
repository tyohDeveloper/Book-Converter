export interface PDFStructure {
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  pages: {
    count: number;
    dimensions: Array<{ width: number; height: number; rotation: number }>;
  };
  fonts: Array<{
    name: string;
    type: string;
    embedded: boolean;
  }>;
  images: {
    count: number;
  };
  fileInfo: {
    sizeBytes: number;
    version?: string;
    encrypted: boolean;
    limitedAnalysis?: boolean;
  };
}
