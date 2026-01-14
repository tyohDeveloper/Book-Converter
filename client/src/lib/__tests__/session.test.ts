import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('session module', () => {
  beforeEach(() => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('getSessionId', () => {
    it('should return a valid UUID format', async () => {
      const { getSessionId } = await import('../session');
      const sessionId = getSessionId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert.ok(uuidRegex.test(sessionId), `Session ID "${sessionId}" should match UUID format`);
    });

    it('should return the same session ID on subsequent calls', async () => {
      const { getSessionId } = await import('../session');
      const first = getSessionId();
      const second = getSessionId();
      assert.strictEqual(first, second, 'Session ID should be consistent');
    });
  });

  describe('getHeaders', () => {
    it('should return headers with X-Session-Id', async () => {
      const { getHeaders, getSessionId } = await import('../session');
      const headers = getHeaders();
      const sessionId = getSessionId();
      assert.deepStrictEqual(headers, { 'X-Session-Id': sessionId });
    });
  });
});
