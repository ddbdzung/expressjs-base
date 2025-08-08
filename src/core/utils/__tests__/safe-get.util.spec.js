import { safeGet } from '../safe-get.util.js';

/**
 * Additional unit tests for safeGet util to reach full branch/line coverage
 */
describe('safeGet()', () => {
  test('returns default when object is null or undefined', () => {
    expect(safeGet(null, 'foo', 'bar')).toBe('bar');
    expect(safeGet(undefined, 'foo', 'baz')).toBe('baz');
  });

  test('returns default when key is missing on object', () => {
    const obj = { existing: 42 };
    expect(safeGet(obj, 'missing', 'fallback')).toBe('fallback');
  });

  test('returns value when key exists on object', () => {
    const obj = { answer: 42 };
    expect(safeGet(obj, 'answer')).toBe(42);
  });
});
