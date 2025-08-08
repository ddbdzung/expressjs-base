import { getStatusText } from '../http-status.constant.js';

describe('getStatusText()', () => {
  test('returns custom text for known code', () => {
    expect(getStatusText(200)).toBe('OK');
  });

  test('returns fallback for unknown code', () => {
    expect(getStatusText(999)).toBe('');
  });
});
