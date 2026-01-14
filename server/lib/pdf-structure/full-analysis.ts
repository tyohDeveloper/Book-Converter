import { PDFDocument, PDFName, PDFRef, PDFStream } from 'pdf-lib';
import * as fs from 'fs/promises';
import type { PDFStructure } from './types';
import { parseFontDict } from './parse-font-dict';
import { getPageResources, getResourceDict } from './get-page-resources';

export async function analyzeFullPDF(filePath: string, fileSize: number): Promise<PDFStructure> {
  const fileBuffer = await fs.readFile(filePath);
  
  const pdfDoc = await PDFDocument.load(fileBuffer, { 
    ignoreEncryption: true,
    updateMetadata: false 
  });
  
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const subject = pdfDoc.getSubject();
  const keywords = pdfDoc.getKeywords();
  const creator = pdfDoc.getCreator();
  const producer = pdfDoc.getProducer();
  const creationDate = pdfDoc.getCreationDate();
  const modificationDate = pdfDoc.getModificationDate();
  
  const pages = pdfDoc.getPages();
  const pageDimensions = pages.map(page => ({
    width: Math.round(page.getWidth()),
    height: Math.round(page.getHeight()),
    rotation: page.getRotation().angle
  }));
  
  const fonts = extractFonts(pdfDoc, pages);
  const imageCount = countImages(pdfDoc, pages);
  
  const version = extractPdfVersion(fileBuffer);
  
  return {
    metadata: {
      title: title || undefined,
      author: author || undefined,
      subject: subject || undefined,
      keywords: keywords || undefined,
      creator: creator || undefined,
      producer: producer || undefined,
      creationDate: creationDate?.toISOString(),
      modificationDate: modificationDate?.toISOString()
    },
    pages: {
      count: pages.length,
      dimensions: pageDimensions
    },
    fonts,
    images: { count: imageCount },
    fileInfo: {
      sizeBytes: fileSize,
      version,
      encrypted: false
    }
  };
}

function extractPdfVersion(fileBuffer: Buffer): string | undefined {
  try {
    const header = fileBuffer.slice(0, 20).toString('ascii');
    const versionMatch = header.match(/%PDF-(\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : undefined;
  } catch (e) {
    return undefined;
  }
}

function extractFonts(pdfDoc: PDFDocument, pages: ReturnType<PDFDocument['getPages']>): PDFStructure['fonts'] {
  const fonts: PDFStructure['fonts'] = [];
  const seenFonts = new Set<string>();
  
  for (const page of pages) {
    const resources = getPageResources(pdfDoc, page);
    if (!resources) continue;

    const fontDict = getResourceDict(pdfDoc, resources, 'Font');
    if (!fontDict) continue;

    for (const [nameObj, fontRef] of fontDict.entries()) {
      const fontInfo = parseFontDict(pdfDoc, nameObj, fontRef);
      if (!fontInfo || seenFonts.has(fontInfo.name)) continue;
      
      seenFonts.add(fontInfo.name);
      fonts.push(fontInfo);
    }
  }
  
  return fonts;
}

function countImages(pdfDoc: PDFDocument, pages: ReturnType<PDFDocument['getPages']>): number {
  let imageCount = 0;
  const seenImages = new Set<string>();
  
  for (const page of pages) {
    const resources = getPageResources(pdfDoc, page);
    if (!resources) continue;

    const xobjectDict = getResourceDict(pdfDoc, resources, 'XObject');
    if (!xobjectDict) continue;

    for (const [nameObj, objRef] of xobjectDict.entries()) {
      try {
        const refStr = objRef instanceof PDFRef ? objRef.toString() : nameObj.toString();
        if (seenImages.has(refStr)) continue;

        const xobj = pdfDoc.context.lookup(objRef);
        if (xobj instanceof PDFStream) {
          const subtypeRef = xobj.dict.get(PDFName.of('Subtype'));
          if (subtypeRef && subtypeRef.toString() === '/Image') {
            seenImages.add(refStr);
            imageCount++;
          }
        }
      } catch (e) {}
    }
  }
  
  return imageCount;
}
