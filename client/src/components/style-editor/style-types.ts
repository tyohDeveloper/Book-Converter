// Style properties for the visual CSS editor

export interface TypographyStyles {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface ColorStyles {
  color: string;
  backgroundColor: string;
}

export interface SpacingStyles {
  marginTop: string;
  marginBottom: string;
  marginLeft: string;
  marginRight: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  maxWidth: string;
}

export interface TextStyles {
  textAlign: string;
  textIndent: string;
}

export interface DocumentStyles {
  typography: TypographyStyles;
  colors: ColorStyles;
  spacing: SpacingStyles;
  text: TextStyles;
}

export const DEFAULT_STYLES: DocumentStyles = {
  typography: {
    fontFamily: "serif",
    fontSize: "16px",
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: "1.6",
    letterSpacing: "normal",
  },
  colors: {
    color: "#333333",
    backgroundColor: "#ffffff",
  },
  spacing: {
    marginTop: "0",
    marginBottom: "0",
    marginLeft: "auto",
    marginRight: "auto",
    paddingTop: "20px",
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "20px",
    maxWidth: "",
  },
  text: {
    textAlign: "left",
    textIndent: "0",
  },
};

export const FONT_SIZES = [
  "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"
];

export const FONT_WEIGHTS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "lighter", label: "Light" },
];

export const TEXT_ALIGNMENTS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];

export const LINE_HEIGHTS = [
  { value: "1", label: "1.0 (Tight)" },
  { value: "1.4", label: "1.4 (Normal)" },
  { value: "1.6", label: "1.6 (Relaxed)" },
  { value: "1.8", label: "1.8 (Loose)" },
  { value: "2", label: "2.0 (Double)" },
];
