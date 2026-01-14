import { describe, it } from 'node:test';
import assert from 'node:assert';
import { removePageNumbers } from '../page-numbers';

describe('removePageNumbers', () => {
  it('should remove standalone numbers', () => {
    const input = 'Content line\n42\nMore content';
    const expected = 'Content line\nMore content';
    assert.strictEqual(removePageNumbers(input), expected);
  });

  it('should remove "page N" format', () => {
    const input = 'Content line\npage 42\nMore content';
    const expected = 'Content line\nMore content';
    assert.strictEqual(removePageNumbers(input), expected);
  });

  it('should remove "Page N" format (case insensitive)', () => {
    const input = 'Content line\nPage 42\nMore content';
    const expected = 'Content line\nMore content';
    assert.strictEqual(removePageNumbers(input), expected);
  });

  it('should remove dash-wrapped numbers "- 42 -"', () => {
    const input = 'Content line\n- 42 -\nMore content';
    const expected = 'Content line\nMore content';
    assert.strictEqual(removePageNumbers(input), expected);
  });

  it('should remove en-dash-wrapped numbers "– 42 –"', () => {
    const input = 'Content line\n– 42 –\nMore content';
    const expected = 'Content line\nMore content';
    assert.strictEqual(removePageNumbers(input), expected);
  });

  it('should remove em-dash-wrapped numbers "— 42 —"', () => {
    const input = 'Content line\n— 42 —\nMore content';
    const expected = 'Content line\nMore content';
    assert.strictEqual(removePageNumbers(input), expected);
  });

  it('should not remove numbers that are part of text', () => {
    const input = 'Chapter 42 is about testing';
    assert.strictEqual(removePageNumbers(input), input);
  });

  it('should not remove numbers within sentences', () => {
    const input = 'There are 42 items in the list.';
    assert.strictEqual(removePageNumbers(input), input);
  });

  it('should handle empty string', () => {
    assert.strictEqual(removePageNumbers(''), '');
  });

  it('should handle multiple page numbers', () => {
    const input = 'Content\n1\nMore content\n2\nFinal content';
    const expected = 'Content\nMore content\nFinal content';
    assert.strictEqual(removePageNumbers(input), expected);
  });
});
