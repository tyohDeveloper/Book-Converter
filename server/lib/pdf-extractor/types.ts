import type { DetectedTable } from '../table-detector/types';

export interface ExtractionProgress {
  stage: 'starting' | 'extracting' | 'detecting_chapters' | 'complete' | 'error';
  percent: number;
  message: string;
}

export interface ExtractedChapter {
  title: string;
  page: number;
  tempFile?: string;
  tables?: DetectedTable[];
}

export interface ExtractionResult {
  success: boolean;
  tempTextFile?: string;
  chapters: ExtractedChapter[];
  totalPages: number;
  previewText: string;
  error?: string;
}

export interface ExtractionHandle {
  promise: Promise<ExtractionResult>;
  cancel: () => void;
}
