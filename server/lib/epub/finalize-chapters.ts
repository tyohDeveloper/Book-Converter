import type { Chapter } from "../text-transforms/types";
import type { ChapterBuildState } from "./create-chapter-state";

export function finalizeChapters(
  state: ChapterBuildState,
  detectedChapters: Chapter[]
): Chapter[] {
  if (state.currentContent.length > 0) {
    if (state.currentChapterIndex >= 0) {
      state.chaptersWithContent.push({
        ...detectedChapters[state.currentChapterIndex],
        content: state.currentContent.join("\n"),
      });
    } else {
      state.chaptersWithContent.push({
        title: "Content",
        page: 1,
        content: state.currentContent.join("\n"),
      });
    }
  }

  if (state.chaptersWithContent.length === 0) {
    state.chaptersWithContent.push({
      title: "Content",
      page: 1,
      content: "",
    });
  }

  return state.chaptersWithContent;
}
