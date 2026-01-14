import { describe, it } from 'node:test';
import assert from 'node:assert';
import { naturalCompare } from '../../../../shared/utils/natural-sort';
import { sortFilesByCustomOrder } from '../sort-files';
import type { ManagedFile } from '../file-manager/types';

describe('naturalCompare', () => {
  it('should sort numbers correctly', () => {
    assert.ok(naturalCompare('file1', 'file2') < 0);
    assert.ok(naturalCompare('file2', 'file10') < 0);
    assert.ok(naturalCompare('file10', 'file2') > 0);
  });

  it('should handle mixed alphanumeric strings', () => {
    assert.ok(naturalCompare('a1b', 'a2b') < 0);
    assert.ok(naturalCompare('a10b', 'a2b') > 0);
  });

  it('should sort alphabetically when no numbers', () => {
    assert.ok(naturalCompare('alpha', 'beta') < 0);
    assert.ok(naturalCompare('beta', 'alpha') > 0);
    assert.strictEqual(naturalCompare('same', 'same'), 0);
  });

  it('should handle chapter numbering correctly', () => {
    const items = ['Chapter 10', 'Chapter 1', 'Chapter 2', 'Chapter 20'];
    items.sort(naturalCompare);
    assert.deepStrictEqual(items, ['Chapter 1', 'Chapter 2', 'Chapter 10', 'Chapter 20']);
  });
});

describe('sortFilesByCustomOrder', () => {
  const createFile = (id: string, name: string): ManagedFile => ({
    id,
    name,
    size: 100,
    uploadedAt: Date.now()
  });

  it('should sort files by custom order', () => {
    const files: ManagedFile[] = [
      createFile('a', 'Alpha.pdf'),
      createFile('b', 'Bravo.pdf'),
      createFile('c', 'Charlie.pdf'),
    ];
    
    const sorted = sortFilesByCustomOrder(files, ['c', 'a', 'b']);
    assert.strictEqual(sorted[0].id, 'c');
    assert.strictEqual(sorted[1].id, 'a');
    assert.strictEqual(sorted[2].id, 'b');
  });

  it('should handle empty custom order gracefully', () => {
    const files: ManagedFile[] = [
      createFile('a', 'Alpha.pdf'),
      createFile('b', 'Bravo.pdf'),
    ];
    
    const sorted = sortFilesByCustomOrder(files, []);
    assert.strictEqual(sorted.length, 2);
  });

  it('should not mutate the original array', () => {
    const files: ManagedFile[] = [
      createFile('1', 'Zulu.pdf'),
      createFile('2', 'Alpha.pdf'),
    ];
    
    const sorted = sortFilesByCustomOrder(files, ['2', '1']);
    assert.strictEqual(files[0].name, 'Zulu.pdf');
    assert.strictEqual(sorted[0].name, 'Alpha.pdf');
  });
});
