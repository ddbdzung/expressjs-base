import { HTTP_OPTIONS, overrideHttpOptions } from '../http-options.config.js';

/**
 * Tests for overrideHttpOptions to reach full coverage on configuration helper.
 */

describe('overrideHttpOptions()', () => {
  const ORIGINAL = { ...HTTP_OPTIONS };

  afterEach(() => {
    // Restore original options so other tests are not affected.
    overrideHttpOptions({ ...ORIGINAL });
  });

  test('mutates HTTP_OPTIONS when overrides are provided', () => {
    expect(HTTP_OPTIONS.USE_STATUS_CODE_IN_RESPONSE).toBe(true);
    overrideHttpOptions({ USE_STATUS_CODE_IN_RESPONSE: false });
    expect(HTTP_OPTIONS.USE_STATUS_CODE_IN_RESPONSE).toBe(false);
  });

  test('does nothing when called without arguments', () => {
    overrideHttpOptions(); // no param
    expect(HTTP_OPTIONS).toEqual(ORIGINAL);
  });
});
