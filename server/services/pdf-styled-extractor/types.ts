export interface StyledTextSpan {
  text: string;
  isItalic: boolean;
  isBold: boolean;
}

export interface StyledLine {
  spans: StyledTextSpan[];
  baselineY: number;
}

export interface StyledPage {
  pageNumber: number;
  lines: StyledLine[];
}

export interface StyledTextResult {
  pages: StyledPage[];
  numPages: number;
}

export interface RawTextItem {
  text: string;
  x: number;
  y: number;
  isItalic: boolean;
  isBold: boolean;
  hasEOL: boolean;
}
