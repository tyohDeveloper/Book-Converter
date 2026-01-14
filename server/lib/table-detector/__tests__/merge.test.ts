import { describe, it } from 'node:test';
import assert from 'node:assert';
import { addTableLineNumbers, mergeTables } from '../helpers/merge';
import type { DetectedTable } from '../types';

describe('Table Detector - Merge Helpers', () => {
  describe('addTableLineNumbers', () => {
    it('should add all line numbers from table range', () => {
      const table: DetectedTable = {
        startLine: 5,
        endLine: 8,
        rows: [],
        strategy: 'pipe',
      };
      const lineNumbers = new Set<number>();
      addTableLineNumbers(table, lineNumbers);
      
      assert.ok(lineNumbers.has(5));
      assert.ok(lineNumbers.has(6));
      assert.ok(lineNumbers.has(7));
      assert.ok(lineNumbers.has(8));
      assert.strictEqual(lineNumbers.size, 4);
    });

    it('should handle single-line tables', () => {
      const table: DetectedTable = {
        startLine: 10,
        endLine: 10,
        rows: [],
        strategy: 'kv',
      };
      const lineNumbers = new Set<number>();
      addTableLineNumbers(table, lineNumbers);
      
      assert.ok(lineNumbers.has(10));
      assert.strictEqual(lineNumbers.size, 1);
    });
  });

  describe('mergeTables', () => {
    it('should return empty array for empty input', () => {
      const result = mergeTables([]);
      assert.deepStrictEqual(result, []);
    });

    it('should return single table unchanged', () => {
      const table: DetectedTable = {
        startLine: 1,
        endLine: 3,
        rows: [['A', 'B']],
        strategy: 'pipe',
      };
      const result = mergeTables([table]);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].startLine, 1);
    });

    it('should merge adjacent tables of same strategy', () => {
      const tables: DetectedTable[] = [
        { startLine: 1, endLine: 3, rows: [['A']], strategy: 'pipe' },
        { startLine: 4, endLine: 6, rows: [['B']], strategy: 'pipe' },
      ];
      const result = mergeTables(tables);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].startLine, 1);
      assert.strictEqual(result[0].endLine, 6);
      assert.strictEqual(result[0].rows.length, 2);
    });

    it('should not merge tables with different strategies', () => {
      const tables: DetectedTable[] = [
        { startLine: 1, endLine: 3, rows: [['A']], strategy: 'pipe' },
        { startLine: 4, endLine: 6, rows: [['B']], strategy: 'kv' },
      ];
      const result = mergeTables(tables);
      assert.strictEqual(result.length, 2);
    });

    it('should not merge tables with large gaps', () => {
      const tables: DetectedTable[] = [
        { startLine: 1, endLine: 3, rows: [['A']], strategy: 'pipe' },
        { startLine: 10, endLine: 12, rows: [['B']], strategy: 'pipe' },
      ];
      const result = mergeTables(tables);
      assert.strictEqual(result.length, 2);
    });

    it('should sort tables by start line before merging', () => {
      const tables: DetectedTable[] = [
        { startLine: 10, endLine: 12, rows: [['B']], strategy: 'pipe' },
        { startLine: 1, endLine: 3, rows: [['A']], strategy: 'pipe' },
      ];
      const result = mergeTables(tables);
      assert.strictEqual(result[0].startLine, 1);
    });
  });
});
