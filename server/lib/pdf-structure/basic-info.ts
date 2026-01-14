import * as fs from 'fs/promises';

export interface BasicPDFInfo {
  version?: string;
  pageCount?: number;
  encrypted: boolean;
}

export async function getBasicPDFInfo(filePath: string): Promise<BasicPDFInfo> {
  const fd = await fs.open(filePath, 'r');
  try {
    const headerBuffer = Buffer.alloc(1024);
    await fd.read(headerBuffer, 0, 1024, 0);
    const header = headerBuffer.toString('ascii');
    
    let version: string | undefined;
    const versionMatch = header.match(/%PDF-(\d+\.\d+)/);
    if (versionMatch) {
      version = versionMatch[1];
    }
    
    const encrypted = header.includes('/Encrypt');
    
    const stats = await fs.stat(filePath);
    const trailerSize = Math.min(10240, stats.size);
    const trailerBuffer = Buffer.alloc(trailerSize);
    await fd.read(trailerBuffer, 0, trailerSize, Math.max(0, stats.size - trailerSize));
    const trailer = trailerBuffer.toString('ascii');
    
    let pageCount: number | undefined;
    const countMatch = trailer.match(/\/Count\s+(\d+)/);
    if (countMatch) {
      pageCount = parseInt(countMatch[1], 10);
    }
    
    return { version, pageCount, encrypted };
  } finally {
    await fd.close();
  }
}
