/**
 * @vitest-environment node
 */
import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractPDFText } from '../pdf-extractor/extractor';
import { convertTextToHtml, detectChapters } from '../html-builder';
import { analyzePDFStructure } from '../pdf-structure/analyze-pdf-structure';
import { detectTables } from '../table-detector/detector';
import { expect } from 'vitest';

const LOYALISTS_DIR = path.join(process.cwd(), 'Loyalists');
const TEST_PDF = path.join(LOYALISTS_DIR, 'Chapter 01 (2,251 words).pdf');
const TEST_PDF_81 = path.join(LOYALISTS_DIR, 'Chapter 81 (2,180 words).pdf');

async function extractText(pdfPath: string) {
  const handle = extractPDFText(pdfPath, true);
  return handle.promise;
}

describe.skipIf(!fs.existsSync(TEST_PDF))('PDF Integration Tests (Loyalists)', () => {

  describe('PDF Text Extraction', () => {
    it('should extract text from Chapter 01', async () => {
      if (!fs.existsSync(TEST_PDF)) {
        console.log('Skipping: Chapter 01 not found');
        return;
      }

      const result = await extractText(TEST_PDF);
      expect(result.success).toBe(true);
      expect(result.tempTextFile).toBeTruthy();
      expect(result.previewText.length).toBeGreaterThan(0);

      if (result.tempTextFile && fs.existsSync(result.tempTextFile)) {
        fs.unlinkSync(result.tempTextFile);
      }
    });

    it('should extract text from Chapter 81 (contains tables)', async () => {
      if (!fs.existsSync(TEST_PDF_81)) {
        console.log('Skipping: Chapter 81 not found');
        return;
      }

      const result = await extractText(TEST_PDF_81);
      expect(result.success).toBe(true);
      expect(result.previewText.length).toBeGreaterThan(100);

      if (result.tempTextFile && fs.existsSync(result.tempTextFile)) {
        fs.unlinkSync(result.tempTextFile);
      }
    });

    it('should handle multiple PDFs efficiently', async () => {
      const pdfs = fs.readdirSync(LOYALISTS_DIR)
        .filter(f => f.endsWith('.pdf'))
        .slice(0, 3)
        .map(f => path.join(LOYALISTS_DIR, f));

      for (const pdf of pdfs) {
        const result = await extractText(pdf);
        expect(result.success).toBe(true);
        
        if (result.tempTextFile && fs.existsSync(result.tempTextFile)) {
          fs.unlinkSync(result.tempTextFile);
        }
      }
    });
  });

  describe('PDF Structure Analysis', () => {
    it('should analyze Chapter 01 structure', async () => {
      if (!fs.existsSync(TEST_PDF)) {
        console.log('Skipping: Chapter 01 not found');
        return;
      }

      const structure = await analyzePDFStructure(TEST_PDF);
      expect(structure.pages.count).toBeGreaterThan(0);
      expect(structure.fileInfo.sizeBytes).toBeGreaterThan(0);
    });
  });


  describe('HTML Conversion', () => {
    it('should convert extracted text to HTML', async () => {
      if (!fs.existsSync(TEST_PDF)) {
        console.log('Skipping: Chapter 01 not found');
        return;
      }

      const result = await extractText(TEST_PDF);
      if (!result.success || !result.tempTextFile) {
        throw new Error('Failed to extract text');
      }

      const text = fs.readFileSync(result.tempTextFile, 'utf-8');
      const html = convertTextToHtml(text, []);
      
      expect(html.length).toBeGreaterThan(0);
      expect(html).not.toContain('<script');

      fs.unlinkSync(result.tempTextFile);
    });

    it('should detect chapters in text', async () => {
      const sampleText = `Chapter 1

This is the first chapter content.

Chapter 2

This is the second chapter content.`;

      const chapters = detectChapters(sampleText);
      expect(chapters.length).toBe(2);
      expect(chapters[0].title).toContain('Chapter 1');
      expect(chapters[1].title).toContain('Chapter 2');
    });

    it('should render tables at correct positions in multi-chapter content', async () => {
      const textWithTablesAndChapters = `Chapter 1

This is the introduction paragraph.

| Name    | Value  |
|---------|--------|
| Alpha   | 100    |
| Beta    | 200    |

More content after the first table.

Chapter 2

Second chapter content here.

| ID | Status   |
|----|----------|
| 1  | Active   |
| 2  | Inactive |

Conclusion of chapter 2.`;

      const tempFile = path.join('/tmp', `test-html-tables-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, textWithTablesAndChapters);

      try {
        const tableResult = await detectTables(tempFile);
        expect(tableResult.tables.length).toBe(2);

        const html = convertTextToHtml(textWithTablesAndChapters, tableResult.tables);
        
        expect(html).toContain('<table');
        expect(html).toContain('Chapter 1');
        expect(html).toContain('Chapter 2');
        
        const tableCount = (html.match(/<table/g) || []).length;
        expect(tableCount).toBe(2);
        
        const chapterIdx1 = html.indexOf('Chapter 1');
        const chapterIdx2 = html.indexOf('Chapter 2');
        const tableIdx1 = html.indexOf('<table');
        const tableIdx2 = html.lastIndexOf('<table');
        
        expect(tableIdx1).toBeGreaterThan(chapterIdx1);
        expect(tableIdx1).toBeLessThan(chapterIdx2);
        expect(tableIdx2).toBeGreaterThan(chapterIdx2);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('Batch Processing', () => {
    it('should process first 5 PDFs without memory issues', async () => {
      const pdfs = fs.readdirSync(LOYALISTS_DIR)
        .filter(f => f.endsWith('.pdf') && !f.includes(' 2.pdf'))
        .sort()
        .slice(0, 5)
        .map(f => path.join(LOYALISTS_DIR, f));

      const results: Array<{file: string, success: boolean, previewLength: number}> = [];
      for (const pdf of pdfs) {
        const result = await extractText(pdf);
        results.push({
          file: path.basename(pdf),
          success: result.success,
          previewLength: result.previewText.length
        });

        if (result.tempTextFile && fs.existsSync(result.tempTextFile)) {
          fs.unlinkSync(result.tempTextFile);
        }
      }

      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(5);
    });
  });
});
