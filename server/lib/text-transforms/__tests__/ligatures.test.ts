import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fixLigatures } from '../ligatures';

describe('fixLigatures', () => {
  it('should replace fi ligature', () => {
    assert.strictEqual(fixLigatures('ofﬁce'), 'office');
  });

  it('should replace fl ligature', () => {
    assert.strictEqual(fixLigatures('ﬂoor'), 'floor');
  });

  it('should replace ff ligature', () => {
    assert.strictEqual(fixLigatures('coﬀee'), 'coffee');
  });

  it('should replace ffi ligature (unicode)', () => {
    assert.strictEqual(fixLigatures('e\ufb03cient'), 'efficient');
  });

  it('should replace ffl ligature (unicode)', () => {
    assert.strictEqual(fixLigatures('ra\ufb04e'), 'raffle');
  });

  it('should replace ae ligature', () => {
    assert.strictEqual(fixLigatures('æsthetic'), 'aesthetic');
  });

  it('should replace AE ligature', () => {
    assert.strictEqual(fixLigatures('Ærospace'), 'AErospace');
  });

  it('should replace oe ligature', () => {
    assert.strictEqual(fixLigatures('œuvre'), 'oeuvre');
  });

  it('should replace OE ligature', () => {
    assert.strictEqual(fixLigatures('Œdipus'), 'OEdipus');
  });

  it('should handle multiple ligatures in one string', () => {
    assert.strictEqual(fixLigatures('The ofﬁce ﬂoor'), 'The office floor');
  });

  it('should handle text with no ligatures', () => {
    assert.strictEqual(fixLigatures('Hello World'), 'Hello World');
  });

  it('should handle empty string', () => {
    assert.strictEqual(fixLigatures(''), '');
  });

  it('should handle Unicode ligature characters', () => {
    assert.strictEqual(fixLigatures('\ufb01nd'), 'find');
    assert.strictEqual(fixLigatures('\ufb02ight'), 'flight');
  });
});
