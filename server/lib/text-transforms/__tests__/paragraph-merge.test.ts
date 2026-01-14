import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mergeParagraphs } from '../paragraph-merge';

describe('mergeParagraphs - correct behavior', () => {
  describe('consecutive lines merge (word-wrapped text)', () => {
    it('merges consecutive non-blank lines into one paragraph', () => {
      const input = `First line of the paragraph
second line continues the text
third line finishes the thought.`;
      
      const result = mergeParagraphs(input, 80);
      assert.strictEqual(result, 'First line of the paragraph second line continues the text third line finishes the thought.');
    });

    it('merges lines that end with lowercase and start with lowercase', () => {
      const input = `This is a long line that continues on
the next line because of word wrapping.`;
      
      const result = mergeParagraphs(input, 50);
      assert.strictEqual(result, 'This is a long line that continues on the next line because of word wrapping.');
    });
  });

  describe('blank lines separate paragraphs', () => {
    it('keeps paragraphs separate when blank line exists', () => {
      const input = `First paragraph text here.

Second paragraph starts after blank line.`;
      
      const result = mergeParagraphs(input, 80);
      const lines = result.split('\n');
      assert.strictEqual(lines[0], 'First paragraph text here.');
      assert.strictEqual(lines[1], '');
      assert.strictEqual(lines[2], 'Second paragraph starts after blank line.');
    });

    it('handles multiple paragraphs correctly', () => {
      const input = `Paragraph one line one
paragraph one line two.

Paragraph two line one
paragraph two line two.

Paragraph three is short.`;
      
      const result = mergeParagraphs(input, 80);
      const lines = result.split('\n');
      assert.strictEqual(lines[0], 'Paragraph one line one paragraph one line two.');
      assert.strictEqual(lines[1], '');
      assert.strictEqual(lines[2], 'Paragraph two line one paragraph two line two.');
      assert.strictEqual(lines[3], '');
      assert.strictEqual(lines[4], 'Paragraph three is short.');
    });
  });

  describe('headings stay separate', () => {
    it('does not merge chapter headings with following text', () => {
      const input = `Chapter 53
The story begins here with a very long line that would normally be merged.`;
      
      const result = mergeParagraphs(input, 80);
      const lines = result.split('\n');
      assert.strictEqual(lines[0], 'Chapter 53');
      assert.strictEqual(lines[1], 'The story begins here with a very long line that would normally be merged.');
    });

    it('detects various heading formats', () => {
      const input1 = `PROLOGUE
The dark and stormy night began.`;
      const result1 = mergeParagraphs(input1, 80);
      assert.ok(result1.split('\n').length >= 2, 'PROLOGUE should stay separate');

      const input2 = `Part 1
This is the first part.`;
      const result2 = mergeParagraphs(input2, 80);
      assert.ok(result2.split('\n').length >= 2, 'Part 1 should stay separate');

      const input3 = `INTRODUCTION
Welcome to this book.`;
      const result3 = mergeParagraphs(input3, 80);
      assert.ok(result3.split('\n').length >= 2, 'INTRODUCTION should stay separate');
    });

    it('does not treat long lines as headings', () => {
      const input = `This is a very long line that is definitely not a heading because it has more than 80 characters in it
and this line continues the same paragraph.`;
      
      const result = mergeParagraphs(input, 80);
      assert.ok(result.includes('This is a very long line') && result.includes('and this line continues'));
    });
  });

  describe('sensitivity controls merging', () => {
    it('default sensitivity merges sentence-ending lines (same paragraph)', () => {
      const input = `This sentence ends.
Another sentence starts in the same paragraph.`;
      
      const result = mergeParagraphs(input, 50);
      assert.strictEqual(result, 'This sentence ends. Another sentence starts in the same paragraph.');
    });

    it('default sensitivity merges mid-sentence lines', () => {
      const input = `This line does not end with punctuation
And continues on the next line.`;
      
      const result = mergeParagraphs(input, 50);
      assert.strictEqual(result, 'This line does not end with punctuation And continues on the next line.');
    });

    it('only blank lines separate paragraphs, not punctuation', () => {
      const input = `First sentence ends here. Second sentence continues
on the next line because of word wrapping.

This is a new paragraph after blank line.`;
      
      const result = mergeParagraphs(input, 50);
      const lines = result.split('\n').filter(l => l.trim());
      assert.strictEqual(lines.length, 2, 'Should have 2 paragraphs (blank line is separator)');
      assert.ok(lines[0].includes('Second sentence continues'));
      assert.ok(lines[1].startsWith('This is a new paragraph'));
    });
  });

  describe('edge cases', () => {
    it('handles empty input', () => {
      assert.strictEqual(mergeParagraphs('', 50), '');
    });

    it('handles single line', () => {
      assert.strictEqual(mergeParagraphs('Just one line.', 50), 'Just one line.');
    });

    it('handles only blank lines', () => {
      const input = `

`;
      const result = mergeParagraphs(input, 50);
      assert.strictEqual(result, '\n\n');
    });

    it('handles hyphenated words', () => {
      const input = `The word is hy-
phenated across lines.`;
      
      const result = mergeParagraphs(input, 50);
      assert.strictEqual(result, 'The word is hy- phenated across lines.');
    });
  });

  describe('realistic book chapter example', () => {
    it('correctly handles chapter with multiple paragraphs', () => {
      const input = `Chapter 53
The Adventurers Guild had a Hall on the edge of the Merchant District just next to the
Central District, which made more sense when one considered the amount of commerce they did
in buying and selling beast parts and materials.

There was a counter to the right side of the doorway that led into the main hall from the
foyer, a smaller room I had first passed through that had two guards sitting watch.

"Welcome to the guild!" the attendant asked.`;
      
      const result = mergeParagraphs(input, 80);
      const lines = result.split('\n').filter(l => l.trim());
      
      assert.strictEqual(lines[0], 'Chapter 53');
      assert.ok(lines[1].startsWith('The Adventurers Guild'));
      assert.ok(lines[1].includes('beast parts and materials.'));
      assert.ok(lines[2].startsWith('There was a counter'));
      assert.ok(lines[2].includes('guards sitting watch.'));
      assert.ok(lines[3].includes('Welcome to the guild'));
    });
  });
});
