// Popular Google Fonts - free to embed via @import
export const GOOGLE_FONTS = [
  { family: "Roboto", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Oswald", category: "sans-serif" },
  { family: "Source Sans Pro", category: "sans-serif" },
  { family: "Raleway", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Merriweather", category: "serif" },
  { family: "PT Sans", category: "sans-serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "Nunito", category: "sans-serif" },
  { family: "Ubuntu", category: "sans-serif" },
  { family: "Inter", category: "sans-serif" },
  { family: "Noto Sans", category: "sans-serif" },
  { family: "Noto Serif", category: "serif" },
  { family: "Crimson Text", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "EB Garamond", category: "serif" },
  { family: "Cormorant Garamond", category: "serif" },
  { family: "Lora", category: "serif" },
  { family: "PT Serif", category: "serif" },
  { family: "Source Serif Pro", category: "serif" },
  { family: "Fira Sans", category: "sans-serif" },
  { family: "Work Sans", category: "sans-serif" },
  { family: "Quicksand", category: "sans-serif" },
  { family: "Josefin Sans", category: "sans-serif" },
  { family: "Bitter", category: "serif" },
  { family: "Cabin", category: "sans-serif" },
  { family: "Inconsolata", category: "monospace" },
  { family: "Fira Code", category: "monospace" },
  { family: "Source Code Pro", category: "monospace" },
  { family: "JetBrains Mono", category: "monospace" },
] as const;

// Generic CSS font families (always available)
export const GENERIC_FONTS = [
  { family: "serif", category: "generic" },
  { family: "sans-serif", category: "generic" },
  { family: "monospace", category: "generic" },
  { family: "cursive", category: "generic" },
  { family: "fantasy", category: "generic" },
  { family: "system-ui", category: "generic" },
  { family: "ui-monospace", category: "generic" },
] as const;

// Common web-safe fonts (usually available on most systems)
export const WEB_SAFE_FONTS = [
  { family: "Arial", category: "sans-serif" },
  { family: "Georgia", category: "serif" },
  { family: "Times New Roman", category: "serif" },
  { family: "Verdana", category: "sans-serif" },
  { family: "Trebuchet MS", category: "sans-serif" },
  { family: "Courier New", category: "monospace" },
  { family: "Palatino Linotype", category: "serif" },
  { family: "Tahoma", category: "sans-serif" },
  { family: "Lucida Console", category: "monospace" },
  { family: "Impact", category: "sans-serif" },
] as const;

export type FontSource = "generic" | "google" | "web-safe" | "system";

export interface FontOption {
  family: string;
  category: string;
  source: FontSource;
  googleImport?: string;
}

export function buildGoogleImport(fontFamily: string): string {
  const urlFamily = fontFamily.replace(/ /g, "+");
  return `@import url('https://fonts.googleapis.com/css2?family=${urlFamily}:wght@400;700&display=swap');`;
}

export function formatFontFamily(font: FontOption): string {
  const needsQuotes = font.family.includes(" ") && font.source !== "generic";
  const family = needsQuotes ? `"${font.family}"` : font.family;
  
  if (font.source === "generic") {
    return family;
  }
  
  // Add appropriate fallback based on category
  const fallback = font.category === "serif" ? "serif" 
    : font.category === "monospace" ? "monospace" 
    : "sans-serif";
  
  return `${family}, ${fallback}`;
}
