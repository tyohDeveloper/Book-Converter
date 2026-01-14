import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mergeParagraphs } from '../paragraph-merge';

describe('mergeParagraphs with protectedLines', () => {
  describe('table row protection', () => {
    it('does not merge protected lines with adjacent lines', () => {
      const input = `Normal paragraph text here
| Column 1 | Column 2 |
| Value 1  | Value 2  |
Another paragraph after table`;

      const protectedLines = new Set([2, 3]);
      const result = mergeParagraphs(input, 50, protectedLines);
      const lines = result.split('\n');

      assert.strictEqual(lines[0], 'Normal paragraph text here');
      assert.strictEqual(lines[1], '| Column 1 | Column 2 |');
      assert.strictEqual(lines[2], '| Value 1  | Value 2  |');
      assert.strictEqual(lines[3], 'Another paragraph after table');
    });

    it('keeps all table rows separate when protected', () => {
      const input = `Header | Value
Row 1  | Data 1
Row 2  | Data 2
Row 3  | Data 3`;

      const protectedLines = new Set([1, 2, 3, 4]);
      const result = mergeParagraphs(input, 50, protectedLines);
      const lines = result.split('\n');

      assert.strictEqual(lines.length, 4);
      assert.strictEqual(lines[0], 'Header | Value');
      assert.strictEqual(lines[1], 'Row 1  | Data 1');
      assert.strictEqual(lines[2], 'Row 2  | Data 2');
      assert.strictEqual(lines[3], 'Row 3  | Data 3');
    });

    it('merges non-protected lines normally while keeping protected lines separate', () => {
      const input = `This is a long paragraph that
spans multiple lines and should
be merged together.

| Table Row 1 |
| Table Row 2 |

Another paragraph that also
spans multiple lines here.`;

      const protectedLines = new Set([5, 6]);
      const result = mergeParagraphs(input, 50, protectedLines);
      const lines = result.split('\n');

      assert.ok(lines[0].includes('This is a long paragraph'));
      assert.ok(lines[0].includes('be merged together.'));
      assert.strictEqual(lines[2], '| Table Row 1 |');
      assert.strictEqual(lines[3], '| Table Row 2 |');
      assert.ok(lines[5].includes('Another paragraph'));
      assert.ok(lines[5].includes('multiple lines here.'));
    });

    it('prevents merging text into protected lines', () => {
      const input = `First part of text
| Protected table row |
more text continues here`;

      const protectedLines = new Set([2]);
      const result = mergeParagraphs(input, 50, protectedLines);
      const lines = result.split('\n');

      assert.strictEqual(lines[0], 'First part of text');
      assert.strictEqual(lines[1], '| Protected table row |');
      assert.strictEqual(lines[2], 'more text continues here');
    });

    it('handles empty protectedLines set like no protection', () => {
      const input = `Line one
line two`;

      const result = mergeParagraphs(input, 50, new Set());
      assert.strictEqual(result, 'Line one line two');
    });

    it('handles undefined protectedLines like no protection', () => {
      const input = `Line one
line two`;

      const result = mergeParagraphs(input, 50, undefined);
      assert.strictEqual(result, 'Line one line two');
    });
  });

  describe('1-based line number indexing', () => {
    it('uses 1-based indexing (first line is 1, not 0)', () => {
      const input = `Line 1 should be protected
Line 2 not protected
Line 3 not protected`;

      const protectedLines = new Set([1]);
      const result = mergeParagraphs(input, 50, protectedLines);
      const lines = result.split('\n');

      assert.strictEqual(lines[0], 'Line 1 should be protected');
      assert.strictEqual(lines[1], 'Line 2 not protected Line 3 not protected');
    });

    it('protects specific lines by 1-based index', () => {
      const input = `Line 1
Line 2 protect this
Line 3
Line 4 protect this too
Line 5`;

      const protectedLines = new Set([2, 4]);
      const result = mergeParagraphs(input, 50, protectedLines);
      const lines = result.split('\n');

      assert.strictEqual(lines[0], 'Line 1');
      assert.strictEqual(lines[1], 'Line 2 protect this');
      assert.strictEqual(lines[2], 'Line 3');
      assert.strictEqual(lines[3], 'Line 4 protect this too');
      assert.strictEqual(lines[4], 'Line 5');
    });
  });
});
