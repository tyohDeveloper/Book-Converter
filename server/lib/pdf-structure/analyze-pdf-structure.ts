import * as fs from 'fs/promises';
import { logger } from "../../common/logger";
import type { PDFStructure } from './types';
import { getBasicPDFInfo } from './basic-info';
import { analyzeFullPDF } from './full-analysis';

const log = logger.child({ module: "pdf-structure" });

const MAX_FULL_PARSE_SIZE = 50 * 1024 * 1024;

export async function analyzePDFStructure(filePath: string): Promise<PDFStructure> {
  const fileStats = await fs.stat(filePath);
  const fileSize = fileStats.size;
  
  if (fileSize > MAX_FULL_PARSE_SIZE) {
    log.info("large file - using lightweight analysis", { path: filePath, sizeMB: (fileSize / 1024 / 1024).toFixed(1) });
    
    const basicInfo = await getBasicPDFInfo(filePath);
    
    return {
      metadata: {},
      pages: {
        count: basicInfo.pageCount || 0,
        dimensions: []
      },
      fonts: [],
      images: { count: 0 },
      fileInfo: {
        sizeBytes: fileSize,
        version: basicInfo.version,
        encrypted: basicInfo.encrypted,
        limitedAnalysis: true
      }
    };
  }
  
  return analyzeFullPDF(filePath, fileSize);
}
