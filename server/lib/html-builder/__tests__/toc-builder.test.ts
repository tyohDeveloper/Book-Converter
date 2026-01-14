import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectChapters, generateTocHtml, escapeHtml } from '../index';

describe('Table of Contents Builder', () => {
  describe('detectChapters', () => {
    it('should detect Chapter N format', () => {
      const text = `Chapter 1
Some content here.

Chapter 2
More content.`;
      const chapters = detectChapters(text);
      assert.ok(chapters.length >= 2, 'Should detect at least 2 chapters');
    });

    it('should detect PROLOGUE and EPILOGUE', () => {
      const text = `PROLOGUE
The beginning.

Chapter 1
Content.

EPILOGUE
The end.`;
      const chapters = detectChapters(text);
      const titles = chapters.map(c => c.title);
      assert.ok(titles.some(t => t.includes('PROLOGUE')), 'Should detect PROLOGUE');
      assert.ok(titles.some(t => t.includes('EPILOGUE')), 'Should detect EPILOGUE');
    });

    it('should return empty array for text without chapters', () => {
      const text = `Just some regular text.
No chapter headings here.
Nothing special.`;
      const chapters = detectChapters(text);
      assert.strictEqual(chapters.length, 0, 'Should return empty array');
    });
  });

  describe('generateTocHtml', () => {
    it('should generate valid HTML for chapters', () => {
      const chapters = [
        { title: 'Chapter 1', id: 'chapter-1', level: 1, lineNumber: 1 },
        { title: 'Chapter 2', id: 'chapter-2', level: 1, lineNumber: 10 },
      ];
      const html = generateTocHtml(chapters);
      assert.ok(html.includes('Chapter 1'), 'Should include chapter title');
      assert.ok(html.includes('href="#chapter-1"'), 'Should include anchor link');
      assert.ok(html.includes('<nav'), 'Should include nav element');
    });

    it('should return empty string for empty chapters', () => {
      const html = generateTocHtml([]);
      assert.strictEqual(html, '', 'Should return empty string');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(input);
      assert.ok(!escaped.includes('<script>'), 'Should escape angle brackets');
      assert.ok(escaped.includes('&lt;'), 'Should use HTML entities');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const escaped = escapeHtml(input);
      assert.ok(escaped.includes('&amp;'), 'Should escape ampersands');
    });

    it('should escape quotes', () => {
      const input = 'He said "Hello"';
      const escaped = escapeHtml(input);
      assert.ok(escaped.includes('&quot;'), 'Should escape quotes');
    });
  });
});
