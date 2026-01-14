import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatFileSize } from '../format/file-size';
import { formatDuration } from '../format/format-duration';
import { formatPercentage } from '../format/format-percentage';

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    assert.strictEqual(formatFileSize(0), '0 B');
  });

  it('should format bytes', () => {
    assert.strictEqual(formatFileSize(500), '500 B');
  });

  it('should format kilobytes', () => {
    assert.strictEqual(formatFileSize(1024), '1 KB');
    assert.strictEqual(formatFileSize(1536), '1.5 KB');
  });

  it('should format megabytes', () => {
    assert.strictEqual(formatFileSize(1048576), '1 MB');
    assert.strictEqual(formatFileSize(5242880), '5 MB');
  });

  it('should format gigabytes', () => {
    assert.strictEqual(formatFileSize(1073741824), '1 GB');
  });

  it('should format terabytes', () => {
    assert.strictEqual(formatFileSize(1099511627776), '1 TB');
  });

  it('should format petabytes', () => {
    assert.strictEqual(formatFileSize(1125899906842624), '1 PB');
  });

  it('should clamp to PB for very large values', () => {
    const result = formatFileSize(1125899906842624 * 1024);
    assert.ok(result.endsWith(' PB'));
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    assert.strictEqual(formatDuration(500), '500ms');
  });

  it('should format seconds', () => {
    assert.strictEqual(formatDuration(5000), '5s');
  });

  it('should format minutes and seconds', () => {
    assert.strictEqual(formatDuration(65000), '1m 5s');
  });
});

describe('formatPercentage', () => {
  it('should format 0%', () => {
    assert.strictEqual(formatPercentage(0, 100), '0%');
  });

  it('should format 50%', () => {
    assert.strictEqual(formatPercentage(50, 100), '50%');
  });

  it('should format 100%', () => {
    assert.strictEqual(formatPercentage(100, 100), '100%');
  });

  it('should handle zero total', () => {
    assert.strictEqual(formatPercentage(50, 0), '0%');
  });

  it('should round percentages', () => {
    assert.strictEqual(formatPercentage(1, 3), '33%');
  });
});
