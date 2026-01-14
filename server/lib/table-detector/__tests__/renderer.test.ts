import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tableToHTML } from '../renderer';
import type { DetectedTable } from '../types';

describe('tableToHTML', () => {
  it('should render a simple table', () => {
    const table: DetectedTable = {
      startLine: 1,
      endLine: 2,
      rows: [['Name', 'John'], ['Age', '30']],
      headerRow: undefined,
      strategy: 'kv'
    };
    const html = tableToHTML(table);
    assert.ok(html.includes('<table class="detected-table">'));
    assert.ok(html.includes('<td>Name</td>'));
    assert.ok(html.includes('<td>John</td>'));
    assert.ok(html.includes('</table>'));
  });

  it('should convert br tags in values', () => {
    const table: DetectedTable = {
      startLine: 1,
      endLine: 1,
      rows: [['Items', 'Item 1<br />Item 2<br />Item 3']],
      headerRow: undefined,
      strategy: 'kv'
    };
    const html = tableToHTML(table);
    assert.ok(html.includes('<br/>'), 'Should contain br tags');
    assert.ok(!html.includes('&lt;br'), 'Should not escape br tags');
  });

  it('should bold definition-style labels at start of value', () => {
    const table: DetectedTable = {
      startLine: 1,
      endLine: 1,
      rows: [['Attributes', 'Shroud: Allows stealth.']],
      headerRow: undefined,
      strategy: 'kv'
    };
    const html = tableToHTML(table);
    assert.ok(html.includes('<strong>Shroud:</strong>'), 'Should bold Shroud:');
  });

  it('should bold definition-style labels after br tags', () => {
    const table: DetectedTable = {
      startLine: 1,
      endLine: 1,
      rows: [['Attributes', 'Shroud: First ability.<br />Quiet: Second ability.<br />Shade: Third ability.']],
      headerRow: undefined,
      strategy: 'kv'
    };
    const html = tableToHTML(table);
    assert.ok(html.includes('<strong>Shroud:</strong>'), 'Should bold Shroud:');
    assert.ok(html.includes('<strong>Quiet:</strong>'), 'Should bold Quiet:');
    assert.ok(html.includes('<strong>Shade:</strong>'), 'Should bold Shade:');
  });

  it('should bold multi-word definition labels', () => {
    const table: DetectedTable = {
      startLine: 1,
      endLine: 1,
      rows: [['Abilities', 'Shadow Step: Teleport between shadows.']],
      headerRow: undefined,
      strategy: 'kv'
    };
    const html = tableToHTML(table);
    assert.ok(html.includes('<strong>Shadow Step:</strong>'), 'Should bold Shadow Step:');
  });

  it('should escape HTML entities in content', () => {
    const table: DetectedTable = {
      startLine: 1,
      endLine: 1,
      rows: [['Code', '<script>alert("xss")</script>']],
      headerRow: undefined,
      strategy: 'kv'
    };
    const html = tableToHTML(table);
    assert.ok(!html.includes('<script>'), 'Should escape script tags');
    assert.ok(html.includes('&lt;script&gt;'), 'Should contain escaped script');
  });
});
