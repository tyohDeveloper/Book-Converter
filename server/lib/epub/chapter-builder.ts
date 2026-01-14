import fs from "fs";
import readline from "readline";
import type { Chapter } from "../text-transforms/types";
import type { ExtractedChapter } from "../pdf-extractor/types";
import { escapeXML, renderContentToXhtml, convertTextToXhtml } from "../html-builder";
import { getTempFilePath } from "../../domain/paths";
import { logger } from "../../common/logger";
import { createInitialState } from "./create-chapter-state";
import { handleChapterLine } from "./handle-chapter-line";
import { finalizeChapters } from "./finalize-chapters";

const log = logger.child({ module: "chapter-builder" });

export async function buildChaptersFromTempFile(
  tempFile: string,
  detectedChapters: Chapter[]
): Promise<Chapter[]> {
  return new Promise((resolve, reject) => {
    const chapterTitles = detectedChapters.map((c) => c.title.trim());
    const state = createInitialState();

    const rl = readline.createInterface({
      input: fs.createReadStream(tempFile, {
        encoding: "utf8",
        highWaterMark: 64 * 1024,
      }),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      handleChapterLine(state, line, chapterTitles, detectedChapters);
    });

    rl.on("close", () => {
      const chapters = finalizeChapters(state, detectedChapters);
      log.debug("built chapters", { count: chapters.length, lines: state.totalLines });
      resolve(chapters);
    });

    rl.on("error", (err) => {
      reject(err);
    });
  });
}

export function getChapterHTML(chapter: Chapter, index: number): string {
  const content = chapter.content || "";
  const htmlContent = convertTextToXhtml(content, []);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>${escapeXML(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css" />
</head>
<body>
  <h1>${escapeXML(chapter.title)}</h1>
${htmlContent}
</body>
</html>`;
}

export async function writeChapterToTempFile(
  chapter: ExtractedChapter,
  index: number,
  includeToc: boolean = false
): Promise<string> {
  const tempXhtmlPath = getTempFilePath(`chapter-xhtml-${index}`, "xhtml");

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>${escapeXML(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css" />
</head>
<body>
  <h1>${escapeXML(chapter.title)}</h1>
`;

  const footer = `</body>
</html>`;

  if (!chapter.tempFile || !fs.existsSync(chapter.tempFile)) {
    await fs.promises.writeFile(tempXhtmlPath, header + footer, "utf8");
    return tempXhtmlPath;
  }

  const content = await fs.promises.readFile(chapter.tempFile, "utf8");
  const xhtmlBody = renderContentToXhtml(content, {
    tables: chapter.tables || [],
    includeToc,
  });

  const xhtmlContent = header + xhtmlBody + "\n" + footer;
  await fs.promises.writeFile(tempXhtmlPath, xhtmlContent, "utf8");

  return tempXhtmlPath;
}
