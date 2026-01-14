import { describe, it } from 'node:test';
import assert from 'node:assert';
import { escapeXML, escapeHtml } from '../xml';

describe('escapeXML', () => {
  it('should escape ampersand', () => {
    assert.strictEqual(escapeXML('Tom & Jerry'), 'Tom &amp; Jerry');
  });

  it('should escape less than', () => {
    assert.strictEqual(escapeXML('a < b'), 'a &lt; b');
  });

  it('should escape greater than', () => {
    assert.strictEqual(escapeXML('a > b'), 'a &gt; b');
  });

  it('should escape double quotes', () => {
    assert.strictEqual(escapeXML('He said "hello"'), 'He said &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    assert.strictEqual(escapeXML("It's fine"), "It&#39;s fine");
  });

  it('should escape all special characters together', () => {
    const input = '<div class="test">Tom & Jerry\'s</div>';
    const expected = '&lt;div class=&quot;test&quot;&gt;Tom &amp; Jerry&#39;s&lt;/div&gt;';
    assert.strictEqual(escapeXML(input), expected);
  });

  it('should handle empty string', () => {
    assert.strictEqual(escapeXML(''), '');
  });

  it('should handle string with no special characters', () => {
    assert.strictEqual(escapeXML('Hello World'), 'Hello World');
  });
});

describe('escapeHtml', () => {
  it('should be an alias for escapeXML', () => {
    const input = '<script>alert("XSS")</script>';
    assert.strictEqual(escapeHtml(input), escapeXML(input));
  });
});
