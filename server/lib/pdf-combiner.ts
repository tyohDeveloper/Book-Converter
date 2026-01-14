import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import { logger } from '../common/logger';

const log = logger.child({ module: "pdf-combiner" });

export interface CombineOptions {
  outputPath?: string;
}

export async function combinePDFs(filePaths: string[], options: CombineOptions = {}): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();
  
  for (const filePath of filePaths) {
    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    } catch (error: any) {
      log.error("failed to process PDF", { path: filePath, error: error.message });
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }
  
  const mergedPdfBytes = await mergedPdf.save();
  return Buffer.from(mergedPdfBytes);
}
