export interface ProcessedPDF {
  totalPages: number;
  chapters: Array<{
    title: string;
    page: number;
  }>;
  preview: string;
}

export interface GenerateEPUBSettings {
  mergeParagraphs: boolean;
  detectChapters: boolean;
  removePageNumbers: boolean;
  sensitivity: number;
  title: string;
  author: string;
  compressionLevel: "fast" | "maximum";
}

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
  };
}

export interface OptimizePDFResult {
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  filename: string;
}
