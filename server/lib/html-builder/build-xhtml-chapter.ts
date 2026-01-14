import { escapeXML } from '../../domain/xml';

export function buildXhtmlChapter(title: string, content: string, skipCss = false): string {
  const escapedTitle = escapeXML(title);
  const stylesheetLink = skipCss ? '' : '<link rel="stylesheet" type="text/css" href="stylesheet.css" />';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>${escapedTitle}</title>
  ${stylesheetLink}
</head>
<body>
  <h1>${escapedTitle}</h1>
${content}
</body>
</html>`;
}
