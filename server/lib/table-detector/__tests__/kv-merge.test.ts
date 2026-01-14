import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mergeKvMultilineValues } from '../helpers/kv-merge';
import type { DetectedTable } from '../types';

describe('Table Detector - KV Merge', () => {
  describe('mergeKvMultilineValues', () => {
    it('should pass through non-KV tables unchanged', () => {
      const table: DetectedTable = {
        startLine: 1,
        endLine: 3,
        rows: [['A', 'B'], ['1', '2']],
        strategy: 'pipe',
      };
      const result = mergeKvMultilineValues(table);
      assert.strictEqual(result.strategy, 'pipe');
      assert.deepStrictEqual(result.rows, table.rows);
    });

    it('should preserve two-column KV rows', () => {
      const table: DetectedTable = {
        startLine: 1,
        endLine: 3,
        rows: [
          ['Name', 'John'],
          ['Age', '30'],
        ],
        strategy: 'kv',
      };
      const result = mergeKvMultilineValues(table);
      assert.strictEqual(result.rows.length, 2);
      assert.deepStrictEqual(result.rows[0], ['Name', 'John']);
      assert.deepStrictEqual(result.rows[1], ['Age', '30']);
    });

    it('should merge continuation rows starting with lowercase', () => {
      const table: DetectedTable = {
        startLine: 1,
        endLine: 4,
        rows: [
          ['Description', 'This is a long'],
          ['description text'],
        ],
        strategy: 'kv',
      };
      const result = mergeKvMultilineValues(table);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0][0], 'Description');
      assert.ok(result.rows[0][1].includes('This is a long'));
      assert.ok(result.rows[0][1].includes('description text'));
    });

    it('should merge list items under key-only rows', () => {
      const table: DetectedTable = {
        startLine: 1,
        endLine: 4,
        rows: [
          ['Materials'],
          ['[SR:001] First item'],
          ['[SR:002] Second item'],
        ],
        strategy: 'kv',
      };
      const result = mergeKvMultilineValues(table);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0][0], 'Materials');
      assert.ok(result.rows[0][1].includes('[SR:001]'));
      assert.ok(result.rows[0][1].includes('[SR:002]'));
      assert.ok(result.rows[0][1].includes('<br />'), 'Should join with <br />');
    });

    it('should merge definition-style rows under key-only rows', () => {
      const table: DetectedTable = {
        startLine: 1,
        endLine: 4,
        rows: [
          ['Abilities'],
          ['Shadow Step: Teleport to a shadow location'],
          ['Shroud: Become invisible in darkness'],
        ],
        strategy: 'kv',
      };
      const result = mergeKvMultilineValues(table);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0][0], 'Abilities');
      assert.ok(result.rows[0][1].includes('Shadow Step:'));
      assert.ok(result.rows[0][1].includes('Shroud:'));
    });
  });
});
