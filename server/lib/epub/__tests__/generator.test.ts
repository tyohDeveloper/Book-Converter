import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { generateEPUBFromHtml } from '../from-html';
import { createTempFile, cleanupTempFile } from '../../../__tests__/test-utils';

async function createTempHtmlFile(content: string): Promise<string> {
  return createTempFile(content, 'html');
}

describe('generateEPUBFromHtml', () => {
  it('should generate valid EPUB structure', async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test Book</title></head>
<body>
<h1>Test Book</h1>
<section class="chapter">
  <h2 class="chapter-heading">Chapter 1</h2>
  <p>Content of chapter 1.</p>
</section>
</body>
</html>`;
    
    const tempPath = await createTempHtmlFile(html);
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Test Book',
        author: 'Test Author'
      });
      
      const zip = await JSZip.loadAsync(buffer);
      
      expect(zip.file('mimetype')).toBeTruthy();
      expect(zip.file('META-INF/container.xml')).toBeTruthy();
      expect(zip.file('OEBPS/content.opf')).toBeTruthy();
      expect(zip.file('OEBPS/toc.ncx')).toBeTruthy();
      expect(zip.file('OEBPS/stylesheet.css')).toBeTruthy();
      expect(zip.file('OEBPS/chapter1.xhtml')).toBeTruthy();
      
      const mimetype = await zip.file('mimetype')!.async('string');
      expect(mimetype).toBe('application/epub+zip');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should extract and include ToC as first chapter', async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test Book</title></head>
<body>
<h1>Test Book</h1>
<nav class="table-of-contents">
  <h2>Table of Contents</h2>
  <ul>
    <li><a href="#chapter-0">Chapter 1: Introduction</a></li>
    <li><a href="#chapter-1">Chapter 2: Content</a></li>
  </ul>
</nav>
<section class="chapter" id="chapter-0">
  <h2 class="chapter-heading">Chapter 1: Introduction</h2>
  <p>Intro content.</p>
</section>
<section class="chapter" id="chapter-1">
  <h2 class="chapter-heading">Chapter 2: Content</h2>
  <p>Main content.</p>
</section>
</body>
</html>`;
    
    const tempPath = await createTempHtmlFile(html);
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Test Book',
        author: 'Test Author'
      });
      
      const zip = await JSZip.loadAsync(buffer);
      
      expect(zip.file('OEBPS/chapter1.xhtml')).toBeTruthy();
      expect(zip.file('OEBPS/chapter2.xhtml')).toBeTruthy();
      expect(zip.file('OEBPS/chapter3.xhtml')).toBeTruthy();
      
      const chapter1 = await zip.file('OEBPS/chapter1.xhtml')!.async('string');
      expect(chapter1).toContain('Table of Contents');
      
      const tocNcx = await zip.file('OEBPS/toc.ncx')!.async('string');
      expect(tocNcx).toContain('Table of Contents');
      expect(tocNcx).toContain('navPoint');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should update ToC links to point to correct chapter files', async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<nav class="table-of-contents">
  <ul>
    <li><a href="#chapter-0">First</a></li>
    <li><a href="#chapter-1">Second</a></li>
  </ul>
</nav>
<section class="chapter" id="chapter-0">
  <h2 class="chapter-heading">First</h2>
  <p>Content</p>
</section>
<section class="chapter" id="chapter-1">
  <h2 class="chapter-heading">Second</h2>
  <p>Content</p>
</section>
</body>
</html>`;
    
    const tempPath = await createTempHtmlFile(html);
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Test',
        author: 'Author'
      });
      
      const zip = await JSZip.loadAsync(buffer);
      const tocChapter = await zip.file('OEBPS/chapter1.xhtml')!.async('string');
      
      expect(tocChapter).toContain('chapter2.xhtml');
      expect(tocChapter).toContain('chapter3.xhtml');
      expect(tocChapter).not.toContain('#chapter-0');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should handle HTML without ToC', async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>No ToC Book</title></head>
<body>
<section class="chapter">
  <h2 class="chapter-heading">Only Chapter</h2>
  <p>Content</p>
</section>
</body>
</html>`;
    
    const tempPath = await createTempHtmlFile(html);
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'No ToC Book',
        author: 'Author'
      });
      
      const zip = await JSZip.loadAsync(buffer);
      
      expect(zip.file('OEBPS/chapter1.xhtml')).toBeTruthy();
      expect(zip.file('OEBPS/chapter2.xhtml')).toBeFalsy();
      
      const chapter1 = await zip.file('OEBPS/chapter1.xhtml')!.async('string');
      expect(chapter1).toContain('Only Chapter');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should escape special characters in title and author', async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<section class="chapter">
  <h2 class="chapter-heading">Chapter</h2>
  <p>Content</p>
</section>
</body>
</html>`;
    
    const tempPath = await createTempHtmlFile(html);
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Tom & Jerry\'s Adventure',
        author: 'Author <Name>'
      });
      
      const zip = await JSZip.loadAsync(buffer);
      const contentOpf = await zip.file('OEBPS/content.opf')!.async('string');
      
      expect(contentOpf).toContain('Tom &amp; Jerry');
      expect(contentOpf).toContain('Author &lt;Name&gt;');
      
      const tocNcx = await zip.file('OEBPS/toc.ncx')!.async('string');
      expect(tocNcx).toContain('Tom &amp; Jerry');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should include correct manifest and spine entries', async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<section class="chapter">
  <h2 class="chapter-heading">Ch 1</h2>
  <p>Content</p>
</section>
<section class="chapter">
  <h2 class="chapter-heading">Ch 2</h2>
  <p>Content</p>
</section>
</body>
</html>`;
    
    const tempPath = await createTempHtmlFile(html);
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Test',
        author: 'Author'
      });
      
      const zip = await JSZip.loadAsync(buffer);
      const contentOpf = await zip.file('OEBPS/content.opf')!.async('string');
      
      expect(contentOpf).toContain('<manifest>');
      expect(contentOpf).toContain('<spine');
      expect(contentOpf).toContain('chapter1.xhtml');
      expect(contentOpf).toContain('chapter2.xhtml');
      expect(contentOpf).toContain('itemref idref="chapter1"');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });
});
