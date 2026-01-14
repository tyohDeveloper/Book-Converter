import { getHeaders } from './session';

export type DebugMode = "operators" | "pdfjsText" | "poppler" | "textBlocks";

export interface PDFOperator {
  name: string;
  args: string[];
  text?: string;
}

export interface PDFTextBlock {
  blockNumber: number;
  text: string;
  operatorCount: number;
}

export interface PDFTextElement {
  type: "text";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
  hasEOL: boolean;
  dir?: string;
}

export interface PDFPageOperators {
  pageNumber: number;
  width: number;
  height: number;
  operators: PDFOperator[];
}

export interface PDFPageTextBlocks {
  pageNumber: number;
  width: number;
  height: number;
  blocks: PDFTextBlock[];
}

export interface PDFPageTextElements {
  pageNumber: number;
  width: number;
  height: number;
  elements: PDFTextElement[];
}

export interface PDFPagePoppler {
  pageNumber: number;
  text: string;
}

export interface PDFDebugInfoOperators {
  mode: "operators";
  fileName: string;
  numPages: number;
  pages: PDFPageOperators[];
}

export interface PDFDebugInfoTextBlocks {
  mode: "textBlocks";
  fileName: string;
  numPages: number;
  pages: PDFPageTextBlocks[];
}

export interface PDFDebugInfoPdfjsText {
  mode: "pdfjsText";
  fileName: string;
  numPages: number;
  pages: PDFPageTextElements[];
}

export interface PDFDebugInfoPoppler {
  mode: "poppler";
  fileName: string;
  numPages: number;
  pages: PDFPagePoppler[];
}

export type PDFDebugInfo = PDFDebugInfoOperators | PDFDebugInfoPdfjsText | PDFDebugInfoPoppler | PDFDebugInfoTextBlocks;

export async function getPDFDebugInfo(
  fileId: string,
  mode: DebugMode = "operators",
  pageRange?: { start?: number; end?: number }
): Promise<PDFDebugInfo> {
  const response = await fetch('/api/debug/pdf-elements', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, mode, pageRange }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get PDF debug info');
  }

  return response.json();
}
