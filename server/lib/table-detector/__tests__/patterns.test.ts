import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isTableBorderLine,
  isTableDataLine,
  parseTableRow,
  isKeyValueLine,
  isTableSectionHeader,
  isKeyValueLineSimple,
  isAlignedColumnLine,
  isContinuationLine,
  mergeKvTableRows
} from '../patterns';

describe('isTableBorderLine', () => {
  it('should detect simple dash border', () => {
    assert.strictEqual(isTableBorderLine('--------'), true);
  });

  it('should detect dash with plus border', () => {
    assert.strictEqual(isTableBorderLine('+--------+'), true);
  });

  it('should detect complex border', () => {
    assert.strictEqual(isTableBorderLine('+--------+--------+'), true);
  });

  it('should detect border with pipes', () => {
    assert.strictEqual(isTableBorderLine('|--------|--------|'), true);
  });

  it('should not detect short lines', () => {
    assert.strictEqual(isTableBorderLine('--'), false);
  });

  it('should not detect regular text', () => {
    assert.strictEqual(isTableBorderLine('Hello World'), false);
  });

  it('should handle whitespace', () => {
    assert.strictEqual(isTableBorderLine('  --------  '), true);
  });
});

describe('isTableDataLine', () => {
  it('should detect pipe-delimited line with outer pipes', () => {
    assert.strictEqual(isTableDataLine('| Name | Age |'), true);
  });

  it('should detect pipe-delimited line with many cells', () => {
    assert.strictEqual(isTableDataLine('| A | B | C |'), true);
  });

  it('should not detect line without outer pipes', () => {
    assert.strictEqual(isTableDataLine('A | B | C'), false);
  });

  it('should not detect short lines', () => {
    assert.strictEqual(isTableDataLine('||'), false);
  });

  it('should not detect regular text', () => {
    assert.strictEqual(isTableDataLine('Hello World'), false);
  });
});

describe('parseTableRow', () => {
  it('should parse pipe-delimited cells', () => {
    const result = parseTableRow('| Name | Age |');
    assert.deepStrictEqual(result, ['Name', 'Age']);
  });

  it('should parse cells without leading/trailing pipes', () => {
    const result = parseTableRow('Name | Age | City');
    assert.deepStrictEqual(result, ['Name', 'Age', 'City']);
  });

  it('should trim cell contents', () => {
    const result = parseTableRow('|  Name  |  Age  |');
    assert.deepStrictEqual(result, ['Name', 'Age']);
  });
});

describe('isKeyValueLine', () => {
  it('should detect key-value with gap', () => {
    const result = isKeyValueLine('Name    John Smith');
    assert.strictEqual(result.isKeyValue, true);
    assert.strictEqual(result.key, 'Name');
    assert.strictEqual(result.value, 'John Smith');
  });

  it('should detect multi-word key', () => {
    const result = isKeyValueLine('Full Name    John Smith');
    assert.strictEqual(result.isKeyValue, true);
    assert.strictEqual(result.key, 'Full Name');
  });

  it('should not detect line without gap', () => {
    const result = isKeyValueLine('This is a normal sentence.');
    assert.strictEqual(result.isKeyValue, false);
  });

  it('should not detect short lines', () => {
    const result = isKeyValueLine('ab');
    assert.strictEqual(result.isKeyValue, false);
  });
});

describe('isTableSectionHeader', () => {
  it('should detect single capitalized word', () => {
    assert.strictEqual(isTableSectionHeader('Materials'), true);
  });

  it('should detect section headers', () => {
    assert.strictEqual(isTableSectionHeader('Attributes'), true);
  });

  it('should not detect all caps', () => {
    assert.strictEqual(isTableSectionHeader('MATERIALS'), false);
  });

  it('should not detect too short words', () => {
    assert.strictEqual(isTableSectionHeader('Ma'), false);
  });

  it('should not detect too long words', () => {
    assert.strictEqual(isTableSectionHeader('ThisIsAReallyLongSectionName'), false);
  });
});

describe('isKeyValueLineSimple', () => {
  it('should detect key-value pattern', () => {
    assert.strictEqual(isKeyValueLineSimple('Name    Value'), true);
  });

  it('should not detect normal text', () => {
    assert.strictEqual(isKeyValueLineSimple('Normal text here'), false);
  });

  it('should not detect short lines', () => {
    assert.strictEqual(isKeyValueLineSimple('ab'), false);
  });
});

describe('isAlignedColumnLine', () => {
  it('should detect aligned columns', () => {
    const result = isAlignedColumnLine('Name    Age    City');
    assert.strictEqual(result.isAligned, true);
    assert.ok(result.columns.length >= 2);
  });

  it('should not detect single word', () => {
    const result = isAlignedColumnLine('SingleWord');
    assert.strictEqual(result.isAligned, false);
  });

  it('should check alignment against previous columns', () => {
    const first = isAlignedColumnLine('Name    Age');
    const second = isAlignedColumnLine('John    25', first.columns);
    assert.strictEqual(second.isAligned, true);
  });

  it('should detect misaligned columns (different column count)', () => {
    const first = isAlignedColumnLine('Name    Age    City');
    const misaligned = isAlignedColumnLine('JohnSmith  25', first.columns);
    assert.strictEqual(misaligned.isAligned, false);
  });
});

describe('isContinuationLine', () => {
  it('should detect indented continuation', () => {
    assert.strictEqual(isContinuationLine('   continued text', 3), true);
  });

  it('should detect lowercase starting text as continuation', () => {
    assert.strictEqual(isContinuationLine('continued text here', 0), true);
  });

  it('should not detect new key-value line as continuation', () => {
    assert.strictEqual(isContinuationLine('NewKey    NewValue', 0), false);
  });
});

describe('mergeKvTableRows', () => {
  it('should merge simple key-value lines', () => {
    const input = [
      { lineNum: 1, key: 'Name', value: 'John Smith' },
      { lineNum: 2, key: 'Age', value: '30' }
    ];
    const result = mergeKvTableRows(input);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], ['Name', 'John Smith']);
    assert.deepStrictEqual(result[1], ['Age', '30']);
  });

  it('should merge continuation lines with previous key', () => {
    const input = [
      { lineNum: 1, key: 'Description', value: 'First line' },
      { lineNum: 2, key: '', value: 'second line continues' }
    ];
    const result = mergeKvTableRows(input);
    assert.strictEqual(result.length, 1);
    assert.ok(result[0][1].includes('First line'));
  });

  it('should handle section headers', () => {
    const input = [
      { lineNum: 1, key: 'Materials', value: '' }
    ];
    const result = mergeKvTableRows(input);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0][0], 'Materials');
  });
});
