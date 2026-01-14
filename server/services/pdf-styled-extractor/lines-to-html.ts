import type { StyledLine, StyledTextSpan } from "./types";
import { escapeHtml } from "../../domain/xml";

function spansToHtml(spans: StyledTextSpan[]): string {
  let html = "";
  for (const span of spans) {
    let text = escapeHtml(span.text);
    if (span.isBold && span.isItalic) {
      text = `<strong><em>${text}</em></strong>`;
    } else if (span.isBold) {
      text = `<strong>${text}</strong>`;
    } else if (span.isItalic) {
      text = `<em>${text}</em>`;
    }
    html += text;
  }
  return html.trim();
}

function calculateBaselineSpacing(lines: StyledLine[]): number {
  if (lines.length < 2) return 15;
  
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = Math.abs(lines[i].baselineY - lines[i - 1].baselineY);
    if (gap > 0) gaps.push(gap);
  }
  
  if (gaps.length === 0) return 15;
  gaps.sort((a, b) => a - b);
  
  const minGap = gaps[0];
  
  if (gaps.length >= 3) {
    const smallGaps = gaps.filter(g => g < minGap * 2.5);
    if (smallGaps.length > 0) {
      return smallGaps[Math.floor(smallGaps.length / 2)];
    }
  }
  
  return minGap;
}

export function styledLinesToHtml(lines: StyledLine[]): string {
  if (lines.length === 0) return "";
  
  const medianSpacing = calculateBaselineSpacing(lines);
  const paragraphThreshold = medianSpacing * 1.5;
  const sceneBreakThreshold = medianSpacing * 2.5;
  
  const paragraphs: string[] = [];
  let currentParagraphLines: string[] = [];
  let lastY = lines[0].baselineY;
  
  for (const line of lines) {
    const lineHtml = spansToHtml(line.spans);
    if (!lineHtml) continue;
    
    const gap = Math.abs(line.baselineY - lastY);
    
    if (currentParagraphLines.length > 0 && gap > paragraphThreshold) {
      paragraphs.push(`<p>${currentParagraphLines.join(" ")}</p>`);
      currentParagraphLines = [];
      
      if (gap > sceneBreakThreshold) {
        const blankLines = Math.round(gap / medianSpacing) - 1;
        for (let i = 0; i < Math.min(blankLines, 3); i++) {
          paragraphs.push(`<p class="scene-break"></p>`);
        }
      }
    }
    
    currentParagraphLines.push(lineHtml);
    lastY = line.baselineY;
  }
  
  if (currentParagraphLines.length > 0) {
    paragraphs.push(`<p>${currentParagraphLines.join(" ")}</p>`);
  }
  
  return paragraphs.join("\n");
}
