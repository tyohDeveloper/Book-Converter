import type { Chapter } from "../text-transforms/types";

export interface ChapterBuildState {
  chaptersWithContent: Chapter[];
  currentChapterIndex: number;
  nextExpectedChapterIndex: number;
  currentContent: string[];
  totalLines: number;
}

export function createInitialState(): ChapterBuildState {
  return {
    chaptersWithContent: [],
    currentChapterIndex: -1,
    nextExpectedChapterIndex: 0,
    currentContent: [],
    totalLines: 0,
  };
}
