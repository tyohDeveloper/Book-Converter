import type { DetectedTable } from "./types";
import { escapeXML } from "../../domain/xml";

function formatDefinitions(text: string): string {
  return text
    .replace(/^([A-Z][a-zA-Z\s]+:)/gm, "<strong>$1</strong>")
    .replace(/(<br\/>)([A-Z][a-zA-Z\s]+:)/g, "$1<strong>$2</strong>");
}

export function tableToHTML(table: DetectedTable): string {
  const lines: string[] = ['<table class="detected-table">'];

  for (const row of table.rows) {
    lines.push("  <tr>");
    for (const cell of row) {
      let escaped = escapeXML(cell)
        .replace(/\n/g, "<br/>")
        .replace(/&lt;br \/&gt;/g, "<br/>");
      escaped = formatDefinitions(escaped);
      lines.push(`    <td>${escaped}</td>`);
    }
    lines.push("  </tr>");
  }

  lines.push("</table>");
  return lines.join("\n");
}
