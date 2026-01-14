import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { generateEPUBFromHtml } from '../from-html';
import { createTempFile, cleanupTempFile } from '../../../__tests__/test-utils';

describe('EPUB CSS Preservation', () => {
  it('should include source HTML style tag CSS in EPUB stylesheet', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Test with CSS</title>
  <style type="text/css">
.italic { font-style: italic; }
.bold { font-weight: bold; }
.custom-class { color: red; margin: 10px; }
  </style>
</head>
<body>
  <h1>Test Document</h1>
  <p class="italic">This is italic text.</p>
  <p class="bold">This is bold text.</p>
  <p class="custom-class">This has custom styling.</p>
</body>
</html>`;

    const tempPath = await createTempFile(html, 'html');
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Test with CSS',
        author: 'Test Author'
      });

      const zip = await JSZip.loadAsync(buffer);
      const stylesheet = await zip.file('OEBPS/stylesheet.css')!.async('string');

      expect(stylesheet).toContain('.italic');
      expect(stylesheet).toContain('font-style: italic');
      expect(stylesheet).toContain('.bold');
      expect(stylesheet).toContain('font-weight: bold');
      expect(stylesheet).toContain('.custom-class');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should preserve italic class from pasted HTML content', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Pasted Content</title>
  <style type="text/css">
.text-center { text-align: center; }
.italic { font-style: italic; }
.bold { font-weight: bold; }
.line-normal { line-height: 1.4; }
  </style>
</head>
<body>
  <h1>Pasted Document</h1>
  <p class="line-normal"><span class="italic">Emphasized text</span> and <span class="bold">strong text</span>.</p>
</body>
</html>`;

    const tempPath = await createTempFile(html, 'html');
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Pasted Content',
        author: 'Test'
      });

      const zip = await JSZip.loadAsync(buffer);
      const stylesheet = await zip.file('OEBPS/stylesheet.css')!.async('string');
      const chapter = await zip.file('OEBPS/chapter1.xhtml')!.async('string');

      expect(stylesheet).toContain('.italic');
      expect(stylesheet).toContain('font-style: italic');
      expect(chapter).toContain('class="italic"');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should merge source CSS with base EPUB stylesheet', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Merged Styles</title>
  <style>.user-style { padding: 20px; }</style>
</head>
<body>
  <h1>Content</h1>
  <p class="user-style">User styled paragraph.</p>
</body>
</html>`;

    const tempPath = await createTempFile(html, 'html');
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Merged Styles',
        author: 'Test'
      });

      const zip = await JSZip.loadAsync(buffer);
      const stylesheet = await zip.file('OEBPS/stylesheet.css')!.async('string');

      expect(stylesheet).toContain('body');
      expect(stylesheet).toContain('h1');
      expect(stylesheet).toContain('.user-style');
      expect(stylesheet).toContain('padding: 20px');
      expect(stylesheet).toContain('Source file styles');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should handle HTML without style tag gracefully', async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>No Styles</title></head>
<body>
  <h1>Plain Content</h1>
  <p>Just plain text without any styling.</p>
</body>
</html>`;

    const tempPath = await createTempFile(html, 'html');
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'No Styles',
        author: 'Test'
      });

      const zip = await JSZip.loadAsync(buffer);
      const stylesheet = await zip.file('OEBPS/stylesheet.css')!.async('string');

      expect(stylesheet).toContain('body');
      expect(stylesheet).not.toContain('Source file styles');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should preserve em and i tag styling in EPUB', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Emphasis Tags</title>
  <style>em, i { font-style: italic; }</style>
</head>
<body>
  <h1>Document with Emphasis</h1>
  <p>This has <em>emphasized</em> and <i>italic</i> text.</p>
</body>
</html>`;

    const tempPath = await createTempFile(html, 'html');
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Emphasis Tags',
        author: 'Test'
      });

      const zip = await JSZip.loadAsync(buffer);
      const chapter = await zip.file('OEBPS/chapter1.xhtml')!.async('string');
      const stylesheet = await zip.file('OEBPS/stylesheet.css')!.async('string');

      expect(chapter).toContain('<em>');
      expect(chapter).toContain('<i>');
      expect(stylesheet).toContain('font-style: italic');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should preserve CSS across multiple chapters', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Multi-Chapter Book</title>
  <style type="text/css">
.italic { font-style: italic; }
.bold { font-weight: bold; }
.highlight { background-color: yellow; }
  </style>
</head>
<body>
  <h1>Multi-Chapter Book</h1>
  <section class="chapter">
    <h2 class="chapter-heading">Chapter 1: Introduction</h2>
    <p class="italic">First chapter italic content.</p>
  </section>
  <section class="chapter">
    <h2 class="chapter-heading">Chapter 2: Development</h2>
    <p class="bold">Second chapter bold content.</p>
  </section>
  <section class="chapter">
    <h2 class="chapter-heading">Chapter 3: Conclusion</h2>
    <p class="highlight">Third chapter highlighted content.</p>
  </section>
</body>
</html>`;

    const tempPath = await createTempFile(html, 'html');
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'Multi-Chapter Book',
        author: 'Test Author'
      });

      const zip = await JSZip.loadAsync(buffer);
      
      expect(zip.file('OEBPS/chapter1.xhtml')).toBeTruthy();
      expect(zip.file('OEBPS/chapter2.xhtml')).toBeTruthy();
      expect(zip.file('OEBPS/chapter3.xhtml')).toBeTruthy();

      const stylesheet = await zip.file('OEBPS/stylesheet.css')!.async('string');
      expect(stylesheet).toContain('.italic');
      expect(stylesheet).toContain('.bold');
      expect(stylesheet).toContain('.highlight');
      expect(stylesheet).toContain('font-style: italic');
      expect(stylesheet).toContain('font-weight: bold');
      expect(stylesheet).toContain('background-color: yellow');

      const allChapterContent = await Promise.all(
        ['chapter1.xhtml', 'chapter2.xhtml', 'chapter3.xhtml'].map(
          f => zip.file(`OEBPS/${f}`)!.async('string')
        )
      );
      const combinedContent = allChapterContent.join('');
      expect(combinedContent).toContain('class="italic"');
      expect(combinedContent).toContain('class="bold"');
      expect(combinedContent).toContain('class="highlight"');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should include source CSS only once in stylesheet', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>No Duplicates</title>
  <style>.unique-style { color: blue; }</style>
</head>
<body>
  <section class="chapter">
    <h2 class="chapter-heading">Chapter</h2>
    <p class="unique-style">Content</p>
  </section>
</body>
</html>`;

    const tempPath = await createTempFile(html, 'html');
    try {
      const buffer = await generateEPUBFromHtml({
        htmlPath: tempPath,
        title: 'No Duplicates',
        author: 'Test'
      });

      const zip = await JSZip.loadAsync(buffer);
      const stylesheet = await zip.file('OEBPS/stylesheet.css')!.async('string');

      const matches = stylesheet.match(/\.unique-style/g);
      expect(matches).toHaveLength(1);
    } finally {
      await cleanupTempFile(tempPath);
    }
  });
});
