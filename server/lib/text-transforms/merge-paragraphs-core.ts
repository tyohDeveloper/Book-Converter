import { shouldMergeWithNext } from "./merge-rules";

export interface MergeParagraphsOptions {
  sensitivity?: number;
  protectedLines?: Set<number>;
}

export function mergeParagraphsCore(
  lines: string[],
  options: MergeParagraphsOptions = {}
): string[] {
  const { sensitivity = 50, protectedLines } = options;
  const result: string[] = [];
  let currentParagraph = "";

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();

    if (protectedLines?.has(lineNumber)) {
      if (currentParagraph) {
        result.push(currentParagraph);
        currentParagraph = "";
      }
      result.push(line);
      continue;
    }

    if (line === "") {
      if (currentParagraph) {
        result.push(currentParagraph);
        currentParagraph = "";
      }
      result.push("");
      continue;
    }

    if (currentParagraph) {
      currentParagraph += " " + line;
    } else {
      currentParagraph = line;
    }

    const nextLine = lines[i + 1];
    const nextTrimmed = nextLine?.trim();
    const nextIsProtected = protectedLines?.has(lineNumber + 1);

    if (!nextTrimmed || nextTrimmed === "" || nextIsProtected || !shouldMergeWithNext(line, nextLine, sensitivity)) {
      result.push(currentParagraph);
      currentParagraph = "";
    }
  }

  if (currentParagraph) {
    result.push(currentParagraph);
  }

  return result;
}
