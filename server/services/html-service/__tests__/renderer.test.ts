import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFileToc, renderSimpleContent } from '../renderer';

describe('HTML Service - Renderer', () => {
  describe('buildFileToc', () => {
    it('should return empty string for single file', () => {
      const files = [{ name: 'Document', fileId: 'file-1' }];
      const result = buildFileToc(files);
      assert.strictEqual(result, '', 'Should return empty string for single file');
    });

    it('should return empty string for empty array', () => {
      const result = buildFileToc([]);
      assert.strictEqual(result, '', 'Should return empty string for empty array');
    });

    it('should generate TOC for multiple files', () => {
      const files = [
        { name: 'Chapter 1', fileId: 'file-1' },
        { name: 'Chapter 2', fileId: 'file-2' },
      ];
      const result = buildFileToc(files);
      assert.ok(result.includes('<nav class="toc">'), 'Should include nav element');
      assert.ok(result.includes('Table of Contents'), 'Should include heading');
      assert.ok(result.includes('href="#file-1"'), 'Should link to first file');
      assert.ok(result.includes('href="#file-2"'), 'Should link to second file');
      assert.ok(result.includes('Chapter 1'), 'Should include first title');
      assert.ok(result.includes('Chapter 2'), 'Should include second title');
    });

    it('should escape HTML in file names', () => {
      const files = [
        { name: 'File <script>alert("xss")</script>', fileId: 'file-1' },
        { name: 'Normal File', fileId: 'file-2' },
      ];
      const result = buildFileToc(files);
      assert.ok(!result.includes('<script>'), 'Should escape script tags');
      assert.ok(result.includes('&lt;script&gt;') || result.includes('&lt;'), 'Should HTML-encode special chars');
    });
  });

  describe('renderSimpleContent', () => {
    it('should combine simple file contents', () => {
      const files = [
        { name: 'Doc1', fileId: 'file-1', html: '<p>Content 1</p>' },
        { name: 'Doc2', fileId: 'file-2', html: '<p>Content 2</p>' },
      ];
      const result = renderSimpleContent(files);
      assert.ok(result.includes('<p>Content 1</p>'), 'Should include first content');
      assert.ok(result.includes('<p>Content 2</p>'), 'Should include second content');
      assert.ok(result.includes('Table of Contents'), 'Should include TOC for multiple files');
    });

    it('should not include TOC for single file', () => {
      const files = [
        { name: 'Doc1', fileId: 'file-1', html: '<p>Content 1</p>' },
      ];
      const result = renderSimpleContent(files);
      assert.ok(result.includes('<p>Content 1</p>'), 'Should include content');
      assert.ok(!result.includes('Table of Contents'), 'Should not include TOC for single file');
    });
  });
});
