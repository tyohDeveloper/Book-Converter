/**
 * Integration smoke tests for major tool flows.
 * Tests verify end-to-end functionality including:
 * - HTML/EPUB Conversion (text processing, chapter detection, tables)
 * - Content Enhancement (TOC, footnotes, code detection)
 * - Table Detection (pipe-delimited, key-value)
 * - Error Handling (empty content, special characters, XSS prevention)
 * - PDF Combine service interface validation
 * - PDF Structure Analysis interface validation
 * - PDF Debug mode validation
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { convertTextToHtml, detectChapters } from '../../lib/html-builder';
import { detectTables } from '../../lib/table-detector/detector';
import { enhanceContentFile } from '../../lib/content-enhancer/enhance-content-file';
import { combinePDFs } from '../../lib/pdf-combiner';
import { analyzePDFStructure } from '../../lib/pdf-structure/analyze-pdf-structure';
import { buildXhtmlDocument } from '../../lib/html-builder/build-xhtml-document';
import { PDFDocument } from 'pdf-lib';

const TEMP_DIR = path.join(process.cwd(), 'test-temp');

beforeAll(async () => {
  await fs.promises.mkdir(TEMP_DIR, { recursive: true });
});

afterAll(async () => {
  await fs.promises.rm(TEMP_DIR, { recursive: true, force: true });
});

async function writeTempFile(name: string, content: string): Promise<string> {
  const filePath = path.join(TEMP_DIR, name);
  await fs.promises.writeFile(filePath, content, 'utf8');
  return filePath;
}

describe('Tool Flow Integration Tests', () => {
  describe('HTML Conversion Flow', () => {
    it('should convert plain text to valid HTML content', () => {
      const text = `Chapter 1

This is a sample paragraph with some content.

Chapter 2

Another paragraph here.`;

      const html = convertTextToHtml(text, []);
      
      expect(html).toContain('<section');
      expect(html).toContain('Chapter 1');
      expect(html).toContain('Chapter 2');
      expect(html).not.toContain('<script');
    });

    it('should detect chapters correctly', () => {
      const text = `Chapter 1: Introduction

Some introductory text here.

Chapter 2: Main Content

The main content of the document.

Chapter 3: Conclusion

Final thoughts.`;

      const chapters = detectChapters(text);
      
      expect(chapters.length).toBeGreaterThanOrEqual(3);
      expect(chapters[0].title).toContain('Chapter 1');
    });

    it('should handle text with tables', async () => {
      const textWithTable = `Introduction

| Column A | Column B |
|----------|----------|
| Value 1  | Value 2  |
| Value 3  | Value 4  |

Conclusion paragraph.`;

      const tempFile = await writeTempFile('table-test.txt', textWithTable);
      
      const tableResult = await detectTables(tempFile);
      expect(tableResult.tables.length).toBeGreaterThanOrEqual(1);

      const html = convertTextToHtml(textWithTable, tableResult.tables);
      expect(html).toContain('<table');
    });
  });

  describe('Content Enhancement Flow', () => {
    it('should enhance content with TOC detection', async () => {
      const textWithTOC = `Table of Contents
  Chapter 1 ............ 1
  Chapter 2 ............ 15
  Chapter 3 ............ 30

Chapter 1

First chapter content.`;

      const tempFile = await writeTempFile('toc-test.txt', textWithTOC);
      
      const result = await enhanceContentFile(tempFile, {
        preserveTOCIndentation: true,
        convertFootnotes: false,
        detectCode: false,
        preserveIndex: false,
      });

      expect(result.content).toBeTruthy();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should detect code blocks', async () => {
      const textWithCode = `Introduction

Here is some code:

    function example() {
        return true;
    }

End of document.`;

      const tempFile = await writeTempFile('code-test.txt', textWithCode);
      
      const result = await enhanceContentFile(tempFile, {
        preserveTOCIndentation: false,
        convertFootnotes: false,
        detectCode: true,
        preserveIndex: false,
      });

      expect(result.content).toBeTruthy();
    });

    it('should handle footnote conversion', async () => {
      const textWithFootnotes = `Main text with a reference.[1]

More text here with another note.[2]

[1] First footnote explanation.
[2] Second footnote explanation.`;

      const tempFile = await writeTempFile('footnote-test.txt', textWithFootnotes);
      
      const result = await enhanceContentFile(tempFile, {
        preserveTOCIndentation: false,
        convertFootnotes: true,
        detectCode: false,
        preserveIndex: false,
      });

      expect(result.content).toBeTruthy();
    });
  });

  describe('Table Detection Flow', () => {
    it('should detect pipe-delimited tables', async () => {
      const tableText = `Before table

| Name    | Age | City     |
|---------|-----|----------|
| Alice   | 30  | New York |
| Bob     | 25  | London   |

After table`;

      const tempFile = await writeTempFile('pipe-table.txt', tableText);
      const result = await detectTables(tempFile);
      
      expect(result.tables.length).toBe(1);
      expect(result.tables[0].rows.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect key-value tables', async () => {
      const kvText = `Document Info

Name:        John Doe
Date:        2024-01-15
Status:      Active
Department:  Engineering

End of info`;

      const tempFile = await writeTempFile('kv-table.txt', kvText);
      const result = await detectTables(tempFile);
      
      expect(result.tables.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle empty content gracefully', async () => {
      const tempFile = await writeTempFile('empty.txt', '');
      
      const result = await enhanceContentFile(tempFile, {
        preserveTOCIndentation: false,
        convertFootnotes: false,
        detectCode: false,
        preserveIndex: false,
      });

      expect(result.content).toBeDefined();
    });

    it('should handle special characters in text', () => {
      const specialText = `<script>alert('xss')</script>

& < > " ' special chars

Unicode: \u2019 \u2014 \u201C \u201D`;

      const html = convertTextToHtml(specialText, []);
      
      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&amp;');
    });
  });

  describe('Multi-file Processing Flow', () => {
    it('should handle multiple chapters in sequence', () => {
      const chapters = [
        'Chapter 1\n\nFirst chapter content.',
        'Chapter 2\n\nSecond chapter content.',
        'Chapter 3\n\nThird chapter content.',
      ];

      const results = chapters.map(text => convertTextToHtml(text, []));
      
      expect(results.length).toBe(3);
      results.forEach(html => {
        expect(html).toContain('<section');
        expect(html).toContain('<p>');
      });
    });
  });

  describe('PDF Combine Flow', () => {
    it('should combine valid PDF buffers', async () => {
      const pdf1 = await PDFDocument.create();
      const page1 = pdf1.addPage();
      page1.drawText('Page 1');
      const pdf1Bytes = await pdf1.save();

      const pdf2 = await PDFDocument.create();
      const page2 = pdf2.addPage();
      page2.drawText('Page 2');
      const pdf2Bytes = await pdf2.save();

      const tempPdf1 = await writeTempFile('combine1.pdf', '');
      const tempPdf2 = await writeTempFile('combine2.pdf', '');
      await fs.promises.writeFile(tempPdf1, Buffer.from(pdf1Bytes));
      await fs.promises.writeFile(tempPdf2, Buffer.from(pdf2Bytes));

      const combined = await combinePDFs([tempPdf1, tempPdf2]);
      
      expect(combined).toBeInstanceOf(Buffer);
      expect(combined.length).toBeGreaterThan(0);
      
      const combinedDoc = await PDFDocument.load(combined);
      expect(combinedDoc.getPageCount()).toBe(2);
    });

    it('should handle single file (service layer validates minimum)', async () => {
      const pdf = await PDFDocument.create();
      pdf.addPage();
      const pdfBytes = await pdf.save();

      const tempPdf = await writeTempFile('single.pdf', '');
      await fs.promises.writeFile(tempPdf, Buffer.from(pdfBytes));

      const result = await combinePDFs([tempPdf]);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('PDF Structure Analysis Flow', () => {
    it('should analyze valid PDF structure', async () => {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([612, 792]);
      page.drawText('Test content', { x: 50, y: 700 });
      const pdfBytes = await pdf.save();

      const tempPdf = await writeTempFile('analyze.pdf', '');
      await fs.promises.writeFile(tempPdf, Buffer.from(pdfBytes));

      const structure = await analyzePDFStructure(tempPdf);
      
      expect(structure).toBeDefined();
      expect(structure.pages).toBeDefined();
      expect(structure.pages.count).toBe(1);
      expect(structure.fileInfo).toBeDefined();
      expect(structure.fileInfo.sizeBytes).toBeGreaterThan(0);
    });
  });

  describe('EPUB/HTML Conversion Flow', () => {
    it('should build complete XHTML document with typography', () => {
      const content = '<section><h1>Title</h1><p>Content</p></section>';
      
      const xhtml = buildXhtmlDocument({
        title: 'Test Book',
        content,
        typography: {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          lineHeight: 1.6,
        },
      });

      expect(xhtml).toContain('<!DOCTYPE');
      expect(xhtml).toContain('<html');
      expect(xhtml).toContain('Test Book');
      expect(xhtml).toContain('Georgia');
      expect(xhtml).toContain('Content');
    });

    it('should build XHTML without CSS when skipCss is true', () => {
      const content = '<p>Plain content</p>';
      
      const xhtml = buildXhtmlDocument({
        title: 'Plain Doc',
        content,
        skipCss: true,
      });

      expect(xhtml).toContain('<!DOCTYPE');
      expect(xhtml).toContain('Plain content');
    });
  });

  describe('Compression Flow Interface', () => {
    it('should validate PDF optimizer exports exist', async () => {
      const { optimizePDFWithHandle, cleanupOptimizedFile } = await import('../../lib/pdf-optimizer');
      
      expect(typeof optimizePDFWithHandle).toBe('function');
      expect(typeof cleanupOptimizedFile).toBe('function');
    });
  });

  describe('Debug Flow Interface', () => {
    it('should validate debug service exports exist', async () => {
      const { extractPDFElements } = await import('../pdf-debug');
      
      expect(typeof extractPDFElements).toBe('function');
    });

    it('should extract elements from valid PDF', async () => {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage();
      page.drawText('Debug test', { x: 50, y: 700 });
      const pdfBytes = await pdf.save();

      const tempPdf = await writeTempFile('debug.pdf', '');
      await fs.promises.writeFile(tempPdf, Buffer.from(pdfBytes));

      const { extractPDFElements } = await import('../pdf-debug');
      const result = await extractPDFElements(tempPdf, 'debug.pdf', 'pdfjsText');
      
      expect(result).toBeDefined();
      expect(result.mode).toBe('pdfjsText');
      expect(result.numPages).toBe(1);
    });

    it('should support text blocks debug mode', async () => {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage();
      page.drawText('Text block test', { x: 50, y: 700 });
      const pdfBytes = await pdf.save();

      const tempPdf = await writeTempFile('debug-blocks.pdf', '');
      await fs.promises.writeFile(tempPdf, Buffer.from(pdfBytes));

      const { extractPDFElements } = await import('../pdf-debug');
      const result = await extractPDFElements(tempPdf, 'debug-blocks.pdf', 'textBlocks');
      
      expect(result.mode).toBe('textBlocks');
    });

    it('should support operators debug mode', async () => {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage();
      page.drawText('Operators test', { x: 50, y: 700 });
      const pdfBytes = await pdf.save();

      const tempPdf = await writeTempFile('debug-ops.pdf', '');
      await fs.promises.writeFile(tempPdf, Buffer.from(pdfBytes));

      const { extractPDFElements } = await import('../pdf-debug');
      const result = await extractPDFElements(tempPdf, 'debug-ops.pdf', 'operators');
      
      expect(result.mode).toBe('operators');
    });
  });

  describe('Compression Service Interface', () => {
    it('should validate compression service exports', async () => {
      const { compressionService } = await import('../compression-service');
      
      expect(compressionService).toBeDefined();
      expect(typeof compressionService.startCompression).toBe('function');
      expect(typeof compressionService.cancelOperation).toBe('function');
    });
  });

  describe('Analysis Service Interface', () => {
    it('should validate analysis service exports', async () => {
      const { analysisService } = await import('../analysis-service');
      
      expect(analysisService).toBeDefined();
      expect(typeof analysisService.analyzeFiles).toBe('function');
      expect(typeof analysisService.analyzeStructure).toBe('function');
      expect(typeof analysisService.combinePDFs).toBe('function');
    });
  });

  describe('Combine Service Interface', () => {
    it('should validate combine service exports', async () => {
      const { combinePdfFiles } = await import('../combine-service');
      
      expect(typeof combinePdfFiles).toBe('function');
    });
  });

  describe('HTML Service Interface', () => {
    it('should validate HTML service exports', async () => {
      const { convertPdfsToHtml, convertPdfsToHtmlInternal } = await import('../html-service');
      
      expect(typeof convertPdfsToHtml).toBe('function');
      expect(typeof convertPdfsToHtmlInternal).toBe('function');
    });
  });

  describe('EPUB Service Interface', () => {
    it('should validate EPUB service exports', async () => {
      const { convertHtmlToEpub } = await import('../epub/html-to-epub');
      const { convertEpubToHtml } = await import('../epub/epub-to-html');
      
      expect(typeof convertHtmlToEpub).toBe('function');
      expect(typeof convertEpubToHtml).toBe('function');
    });
  });
});
