import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { preparePdfForHtmlPageAware } from '../pipelines/text-prep';
import * as textPrep from '../pipelines/text-prep';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_FIXTURES_DIR = path.join(__dirname, '../../__fixtures__');

describe('preparePdfForHtmlPageAware', () => {
  describe('page separation', () => {
    it('should split PDF into separate pages based on form-feed characters', async () => {
      const testPdfPath = path.join(TEST_FIXTURES_DIR, 'multi-page.pdf');
      
      try {
        await fs.access(testPdfPath);
      } catch {
        console.log('Skipping test: multi-page.pdf fixture not found');
        return;
      }

      const result = await preparePdfForHtmlPageAware(testPdfPath, {});
      
      assert.ok(result.pages.length > 0, 'Should have at least one page');
      assert.ok(Array.isArray(result.pages), 'pages should be an array');
      
      for (const page of result.pages) {
        assert.ok(typeof page.pageNumber === 'number', 'pageNumber should be a number');
        assert.ok(typeof page.text === 'string', 'text should be a string');
        assert.ok(Array.isArray(page.tables), 'tables should be an array');
      }
    });

    it('should not merge paragraphs across page boundaries', async () => {
      const testPdfPath = path.join(TEST_FIXTURES_DIR, 'multi-page.pdf');
      
      try {
        await fs.access(testPdfPath);
      } catch {
        console.log('Skipping test: multi-page.pdf fixture not found');
        return;
      }

      const result = await preparePdfForHtmlPageAware(testPdfPath, { mergeParagraphs: true });
      
      for (let i = 0; i < result.pages.length - 1; i++) {
        const currentPage = result.pages[i];
        const nextPage = result.pages[i + 1];
        
        const currentLastLine = currentPage.text.split('\n').pop()?.trim() || '';
        const nextFirstLine = nextPage.text.split('\n')[0]?.trim() || '';
        
        assert.ok(
          !currentLastLine.endsWith(nextFirstLine.split(' ')[0]),
          `Page ${i + 1} last line should not contain content from page ${i + 2}`
        );
      }
    });
  });

  describe('per-page processing', () => {
    it('should apply cleanup to each page independently', async () => {
      const testPdfPath = path.join(TEST_FIXTURES_DIR, 'ligatures.pdf');
      
      try {
        await fs.access(testPdfPath);
      } catch {
        console.log('Skipping test: ligatures.pdf fixture not found');
        return;
      }

      const result = await preparePdfForHtmlPageAware(testPdfPath, { fixLigatures: true });
      
      for (const page of result.pages) {
        assert.ok(!page.text.includes('ﬁ'), 'fi ligature should be fixed');
        assert.ok(!page.text.includes('ﬂ'), 'fl ligature should be fixed');
      }
    });

    it('should detect tables within each page', async () => {
      const testPdfPath = path.join(TEST_FIXTURES_DIR, 'tables.pdf');
      
      try {
        await fs.access(testPdfPath);
      } catch {
        console.log('Skipping test: tables.pdf fixture not found');
        return;
      }

      const result = await preparePdfForHtmlPageAware(testPdfPath, { detectTables: true });
      
      const pagesWithTables = result.pages.filter(p => p.tables.length > 0);
      assert.ok(pagesWithTables.length > 0, 'Should detect tables on at least one page');
    });
  });

  describe('result structure', () => {
    it('should return ProcessedPage objects with correct structure', async () => {
      const testPdfPath = path.join(TEST_FIXTURES_DIR, 'simple.pdf');
      
      try {
        await fs.access(testPdfPath);
      } catch {
        console.log('Skipping test: simple.pdf fixture not found');
        return;
      }

      const result = await preparePdfForHtmlPageAware(testPdfPath, {});
      
      assert.ok('pages' in result, 'result should have pages');
      assert.ok('chapters' in result, 'result should have chapters');
      assert.ok('tempFiles' in result, 'result should have tempFiles');
      
      if (result.pages.length > 0) {
        const page = result.pages[0];
        assert.ok('pageNumber' in page, 'page should have pageNumber');
        assert.ok('text' in page, 'page should have text');
        assert.ok('tables' in page, 'page should have tables');
      }
    });

    it('should return empty tempFiles array (no file I/O)', async () => {
      const testPdfPath = path.join(TEST_FIXTURES_DIR, 'simple.pdf');
      
      try {
        await fs.access(testPdfPath);
      } catch {
        console.log('Skipping test: simple.pdf fixture not found');
        return;
      }

      const result = await preparePdfForHtmlPageAware(testPdfPath, {});
      
      assert.deepStrictEqual(result.tempFiles, [], 'tempFiles should be empty');
    });
  });
});

describe('cleanupPageText', () => {
  it('should fix ligatures in page text', () => {
    const cleanupPageText = (textPrep as any).cleanupPageText;
    
    if (typeof cleanupPageText !== 'function') {
      console.log('Skipping test: cleanupPageText is not exported');
      return;
    }

    const input = 'The ﬁrst ﬂoor has ﬀects';
    const result = cleanupPageText(input, { fixLigatures: true });
    
    assert.strictEqual(result, 'The first floor has ffects');
  });

  it('should fix hyphenation within page', () => {
    const cleanupPageText = (textPrep as any).cleanupPageText;
    
    if (typeof cleanupPageText !== 'function') {
      console.log('Skipping test: cleanupPageText is not exported');
      return;
    }

    const input = 'This is a hyphen-\nated word';
    const result = cleanupPageText(input, { fixHyphenation: true });
    
    assert.ok(result.includes('hyphenated'), 'Hyphenation should be fixed');
  });

  it('should collapse multiple blank lines', () => {
    const cleanupPageText = (textPrep as any).cleanupPageText;
    
    if (typeof cleanupPageText !== 'function') {
      console.log('Skipping test: cleanupPageText is not exported');
      return;
    }

    const input = 'Line 1\n\n\n\nLine 2';
    const result = cleanupPageText(input, { cleanWhitespace: true });
    
    const blankLines = result.split('\n').filter(l => l === '').length;
    assert.strictEqual(blankLines, 1, 'Should collapse to single blank line');
  });
});
