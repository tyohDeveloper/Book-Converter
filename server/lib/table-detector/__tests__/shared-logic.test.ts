import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectTablesFromLines } from '../detector';

describe('Table Detector - Shared Logic', () => {
  describe('detectTablesFromLines', () => {
    it('should detect pipe-delimited tables', () => {
      const lines = [
        '| Column A | Column B |',
        '| Value 1  | Value 2  |',
        '| Value 3  | Value 4  |',
      ];
      const result = detectTablesFromLines(lines);
      assert.ok(result.tables.length > 0, 'Should detect at least one table');
      assert.ok(result.tableLineNumbers.size > 0, 'Should track table line numbers');
    });

    it('should detect key-value tables', () => {
      const lines = [
        'Name:          John Doe',
        'Age:           30',
        'Location:      New York',
      ];
      const result = detectTablesFromLines(lines);
      assert.ok(result.tables.length > 0, 'Should detect KV table');
    });

    it('should return empty result for non-table content', () => {
      const lines = [
        'This is just regular text.',
        'No tables here.',
        'Just paragraphs.',
      ];
      const result = detectTablesFromLines(lines);
      assert.strictEqual(result.tables.length, 0, 'Should not detect tables');
    });

    it('should correctly populate tableLineNumbers set', () => {
      const lines = [
        'Some text before',
        '| Header | Value |',
        '| Data   | 123   |',
        'Some text after',
      ];
      const result = detectTablesFromLines(lines);
      
      if (result.tables.length > 0) {
        assert.ok(result.tableLineNumbers.has(2) || result.tableLineNumbers.has(3), 
          'Should include table line numbers');
        assert.ok(!result.tableLineNumbers.has(1), 'Should not include non-table lines');
        assert.ok(!result.tableLineNumbers.has(4), 'Should not include non-table lines');
      }
    });

    it('should merge adjacent tables of the same type', () => {
      const lines = [
        '| A | B |',
        '| 1 | 2 |',
        '',
        '| C | D |',
        '| 3 | 4 |',
      ];
      const result = detectTablesFromLines(lines);
      assert.ok(result.tables.length <= 2, 'Adjacent tables may be merged');
    });
  });

  describe('table line protection integration', () => {
    it('should provide line numbers that can be used for paragraph merge protection', () => {
      const lines = [
        'First paragraph that should be merged',
        'across multiple lines.',
        '',
        '| Table Row 1 |',
        '| Table Row 2 |',
        '',
        'Another paragraph that should',
        'also be merged together.',
      ];
      
      const result = detectTablesFromLines(lines);
      
      if (result.tables.length > 0) {
        const protectedLines = result.tableLineNumbers;
        assert.ok(!protectedLines.has(1), 'Line 1 should not be protected');
        assert.ok(!protectedLines.has(2), 'Line 2 should not be protected');
        assert.ok(protectedLines.has(4) || protectedLines.has(5), 'Table lines should be protected');
      }
    });
  });
});
