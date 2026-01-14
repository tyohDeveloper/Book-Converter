export function detectFontStyle(fontName: string | undefined): { isItalic: boolean; isBold: boolean } {
  if (!fontName) return { isItalic: false, isBold: false };
  
  const lower = fontName.toLowerCase();
  
  const isItalic = 
    lower.includes("italic") || 
    lower.includes("oblique") || 
    lower.includes("-it-") ||
    lower.includes("_it_") ||
    /[-_]it$/.test(lower) ||
    /italic$/i.test(fontName) ||
    /[a-z]it$/i.test(fontName) ||
    lower.endsWith("it");
    
  const isBold = 
    lower.includes("bold") || 
    lower.includes("-bd-") ||
    lower.includes("_bd_") ||
    /[-_]bd$/.test(lower) ||
    lower.includes("black") || 
    lower.includes("heavy") ||
    lower.includes("semibold") ||
    lower.includes("demibold");
  
  return { isItalic, isBold };
}
