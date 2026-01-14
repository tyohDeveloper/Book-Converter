import { spawn } from "child_process";
import { logger } from "../../common/logger";

const log = logger.child({ service: "pdf-fonts" });

export interface PdfFont {
  name: string;
  type: string;
  encoding: string;
  embedded: boolean;
  subset: boolean;
}

export interface ExtractFontsResult {
  fonts: PdfFont[];
}

function parseFontLine(line: string): PdfFont | null {
  const parts = line.split(/\s{2,}/);
  if (parts.length < 5) return null;
  
  const name = parts[0]?.trim();
  const type = parts[1]?.trim() || "";
  const encoding = parts[2]?.trim() || "";
  const emb = parts[3]?.trim()?.toLowerCase() || "";
  const sub = parts[4]?.trim()?.toLowerCase() || "";
  
  if (!name || name === "name" || name.startsWith("-")) return null;
  
  return {
    name,
    type,
    encoding,
    embedded: emb === "yes",
    subset: sub === "yes",
  };
}

export async function extractPdfFonts(pdfPath: string): Promise<ExtractFontsResult> {
  return new Promise((resolve) => {
    const proc = spawn("pdffonts", [pdfPath], { stdio: ["ignore", "pipe", "pipe"] });
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    
    proc.on("error", (err) => {
      log.warn("pdffonts error", { error: err.message });
      resolve({ fonts: [] });
    });
    
    proc.on("close", (code) => {
      if (code !== 0) {
        log.warn("pdffonts exited with error", { code, stderr });
        resolve({ fonts: [] });
        return;
      }
      
      const lines = stdout.split("\n");
      const fonts: PdfFont[] = [];
      
      for (let i = 2; i < lines.length; i++) {
        const font = parseFontLine(lines[i]);
        if (font) fonts.push(font);
      }
      
      const uniqueFonts = fonts.filter((f, i, arr) => 
        arr.findIndex(x => x.name === f.name) === i
      );
      
      log.debug("Extracted fonts from PDF", { count: uniqueFonts.length });
      resolve({ fonts: uniqueFonts });
    });
  });
}
