import { escapeXML } from "../html-builder";

export interface ChapterXhtmlOptions {
  title: string;
  content: string;
  includeStylesheet?: boolean;
}

export function buildChapterXhtml(options: ChapterXhtmlOptions): string {
  const { title, content, includeStylesheet = true } = options;
  const styleLink = includeStylesheet
    ? `  <link rel="stylesheet" type="text/css" href="stylesheet.css" />\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>${escapeXML(title)}</title>
${styleLink}</head>
<body>
  <h1>${escapeXML(title)}</h1>
${content}
</body>
</html>`;
}
