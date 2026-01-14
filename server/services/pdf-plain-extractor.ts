import { spawn } from "child_process";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface PlainTextResult {
  pages: ExtractedPage[];
  combinedText: string;
  numPages: number;
}

export async function extractPlainText(pdfPath: string): Promise<PlainTextResult> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    const proc = spawn('pdftotext', ['-layout', pdfPath, '-']);
    
    proc.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    proc.stderr.on('data', (data: Buffer) => {
      console.warn('pdftotext stderr:', data.toString());
    });
    
    proc.on('error', (err) => {
      reject(new Error(`Failed to run pdftotext: ${err.message}`));
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pdftotext exited with code ${code}`));
        return;
      }
      
      const fullText = Buffer.concat(chunks).toString('utf8');
      
      const pageTexts = fullText.split('\f');
      
      const pages: ExtractedPage[] = pageTexts
        .map((text, index) => ({
          pageNumber: index + 1,
          text: text.trim(),
        }))
        .filter(p => p.text.length > 0);
      
      const combinedText = pages.map(p => p.text).join("\n\n");
      
      resolve({
        pages,
        combinedText,
        numPages: pages.length,
      });
    });
  });
}
