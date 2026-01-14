import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  CHAPTER_PATTERNS_FLEXIBLE,
  CHAPTER_PATTERNS_STRICT,
  CHAPTER_PATTERNS_STANDALONE,
  isChapterHeading,
  generateChapterId
} from '../chapter';

describe('isChapterHeading', () => {
  describe('with CHAPTER_PATTERNS_FLEXIBLE', () => {
    it('should detect "Chapter 1"', () => {
      assert.strictEqual(isChapterHeading('Chapter 1', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should detect "Chapter I"', () => {
      assert.strictEqual(isChapterHeading('Chapter I', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should detect "Chapter 1: The Beginning"', () => {
      assert.strictEqual(isChapterHeading('Chapter 1: The Beginning', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should detect "Part 2"', () => {
      assert.strictEqual(isChapterHeading('Part 2', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should detect "Prologue"', () => {
      assert.strictEqual(isChapterHeading('Prologue', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should detect "Epilogue"', () => {
      assert.strictEqual(isChapterHeading('Epilogue', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should detect "Introduction"', () => {
      assert.strictEqual(isChapterHeading('Introduction', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should detect "Appendix A"', () => {
      assert.strictEqual(isChapterHeading('Appendix A', CHAPTER_PATTERNS_FLEXIBLE), true);
    });

    it('should not detect regular text', () => {
      assert.strictEqual(isChapterHeading('This is a regular sentence.', CHAPTER_PATTERNS_FLEXIBLE), false);
    });

    it('should not detect empty string', () => {
      assert.strictEqual(isChapterHeading('', CHAPTER_PATTERNS_FLEXIBLE), false);
    });

    it('should not detect very long strings (>100 chars)', () => {
      const longString = 'Chapter 1: ' + 'x'.repeat(100);
      assert.strictEqual(isChapterHeading(longString, CHAPTER_PATTERNS_FLEXIBLE), false);
    });
  });

  describe('with CHAPTER_PATTERNS_STRICT', () => {
    it('should detect "Chapter 1" (standalone)', () => {
      assert.strictEqual(isChapterHeading('Chapter 1', CHAPTER_PATTERNS_STRICT), true);
    });

    it('should detect "CHAPTER 5"', () => {
      assert.strictEqual(isChapterHeading('CHAPTER 5', CHAPTER_PATTERNS_STRICT), true);
    });

    it('should detect numbered sections like "1.1 Introduction"', () => {
      assert.strictEqual(isChapterHeading('1.1 Introduction', CHAPTER_PATTERNS_STRICT), true);
    });
  });
});

describe('generateChapterId', () => {
  it('should generate chapter-1 for index 0', () => {
    assert.strictEqual(generateChapterId(0), 'chapter-1');
  });

  it('should generate chapter-5 for index 4', () => {
    assert.strictEqual(generateChapterId(4), 'chapter-5');
  });
});
