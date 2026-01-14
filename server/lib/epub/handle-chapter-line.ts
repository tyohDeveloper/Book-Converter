import type { Chapter } from "../text-transforms/types";
import type { ChapterBuildState } from "./create-chapter-state";

export function handleChapterLine(
  state: ChapterBuildState,
  line: string,
  chapterTitles: string[],
  detectedChapters: Chapter[]
): void {
  state.totalLines++;
  const trimmedLine = line.trim();

  let chapterIndex = -1;
  if (
    state.nextExpectedChapterIndex < chapterTitles.length &&
    trimmedLine === chapterTitles[state.nextExpectedChapterIndex]
  ) {
    chapterIndex = state.nextExpectedChapterIndex;
  }

  if (chapterIndex !== -1) {
    if (state.currentChapterIndex >= 0 && state.currentContent.length > 0) {
      state.chaptersWithContent.push({
        ...detectedChapters[state.currentChapterIndex],
        content: state.currentContent.join("\n"),
      });
    }

    state.currentChapterIndex = chapterIndex;
    state.nextExpectedChapterIndex = chapterIndex + 1;
    state.currentContent = [];
  } else if (state.currentChapterIndex >= 0) {
    state.currentContent.push(line);

    if (state.currentContent.length > 50000) {
      state.chaptersWithContent.push({
        ...detectedChapters[state.currentChapterIndex],
        title:
          detectedChapters[state.currentChapterIndex].title +
          ` (cont'd ${state.chaptersWithContent.length + 1})`,
        content: state.currentContent.join("\n"),
      });
      state.currentContent = [];
    }
  } else {
    state.currentContent.push(line);
  }
}
