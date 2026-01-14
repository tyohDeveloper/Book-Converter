import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectTables } from '../detector';
import { createTempFile, cleanupTempFile } from '../../../__tests__/test-utils';

describe('detectTables', () => {
  it('should detect a simple KV table', async () => {
    const content = `Name    John Smith
Age     30
City    New York`;
    const tempPath = await createTempFile(content);
    try {
      const result = await detectTables(tempPath);
      assert.strictEqual(result.tables.length, 1);
      assert.strictEqual(result.tables[0].strategy, 'kv');
      assert.strictEqual(result.tables[0].rows.length, 3);
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should merge multiline values under key-only rows', async () => {
    const content = `Name              Shade Walker Set
Origin            Manufactured
                  [SR:001] Item One
                  [SR:002] Item Two
Materials
                  [SR:003] Item Three
                  [SR:004] Item Four
Quality           Perfect`;
    const tempPath = await createTempFile(content);
    try {
      const result = await detectTables(tempPath);
      assert.strictEqual(result.tables.length, 1);
      const rows = result.tables[0].rows;
      const materialsRow = rows.find(r => r[0] === 'Materials');
      assert.ok(materialsRow, 'Materials row should exist');
      assert.ok(materialsRow[1].includes('[SR:003]'), 'Should include items after key');
      assert.ok(materialsRow[1].includes('[SR:004]'), 'Should include items after key');
      assert.ok(materialsRow[1].includes('<br />'), 'Should join with br tags');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should merge definition-style rows under Attributes key', async () => {
    const content = `Name    Test Item
Shroud: Allows stealth mode activation.
Quiet: Reduces sound output significantly.
Attributes
Shade: Hides in shadows effectively.
Shadow Step: Teleport between shadows.
Abilities Shroud | Quiet | Shade`;
    const tempPath = await createTempFile(content);
    try {
      const result = await detectTables(tempPath);
      assert.strictEqual(result.tables.length, 1);
      const rows = result.tables[0].rows;
      const attrRow = rows.find(r => r[0] === 'Attributes');
      assert.ok(attrRow, 'Attributes row should exist');
      assert.ok(attrRow[1].includes('Shroud:'), 'Should include Shroud definition');
      assert.ok(attrRow[1].includes('Shadow Step:'), 'Should include Shadow Step definition');
    } finally {
      await cleanupTempFile(tempPath);
    }
  });

  it('should keep KV table unified even with mixed content types', async () => {
    const content = `Name              Shade Walker Set
Origin            Manufactured: Daedalus
Age               New
Grade             Epic
                  [SR:001] Dreadstalker Fiber
                  [SR:002] Dreadstalker Core
Materials
                  [SR:003] Refined Umbral Ingot
                  [SR:004] Refined Dreadcloth
                  Shroud: Allows the user to become almost imperceptible.
                  Quiet: Allows the user to move silently.
Attributes
                  Shade: Allows hiding in shadows.
                  Shadow Step: Teleport between shadows.
Abilities         Shroud | Quiet | Shade | Shadow Step
                  Replenishment Rune [Standard]
Runes
                  Stealth Rune [Standard]
Power Source      Infused Core [Epic-Grade]
Evolution         Yes [0%]
Quality           Perfect`;
    const tempPath = await createTempFile(content);
    try {
      const result = await detectTables(tempPath);
      assert.strictEqual(result.tables.length, 1, 'Should be one unified table');
      const table = result.tables[0];
      assert.strictEqual(table.strategy, 'kv');
      const rowKeys = table.rows.map(r => r[0]);
      assert.ok(rowKeys.includes('Name'));
      assert.ok(rowKeys.includes('Materials'));
      assert.ok(rowKeys.includes('Attributes'));
      assert.ok(rowKeys.includes('Runes'));
      assert.ok(rowKeys.includes('Power Source'));
    } finally {
      await cleanupTempFile(tempPath);
    }
  });
});
