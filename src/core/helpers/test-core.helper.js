/**
 * helpers/test-core.helper.js
 * --------------------------------------------------------------------------
 * Centralised utilities for unit-tests that need Express mocks or to mutate
 * HTTP_OPTIONS.  Having a single helper file keeps __tests__ folders clean.
 */
import {
  HTTP_OPTIONS,
  overrideHttpOptions,
} from '../config/http-options.config.js';

/* -------------------------------------------------------------------------- */
/* Express mocks                                                              */
/* -------------------------------------------------------------------------- */

export function createMockRes() {
  const res = { headersSent: false };
  res.status = jest.fn().mockImplementation(function (code) {
    res.statusCode = code;
    return res;
  });
  res.type = jest.fn().mockImplementation(() => res);
  res.json = jest.fn().mockImplementation(payload => {
    res.body = payload;
    res.headersSent = true;
    return res;
  });
  res.send = jest.fn().mockImplementation(payload => {
    res.body = payload;
    res.headersSent = true;
    return res;
  });
  res.wasSent = () =>
    res.status.mock.calls.length > 0 &&
    (res.json.mock.calls.length > 0 || res.send.mock.calls.length > 0);
  return res;
}

export function createMockReq(overrides = {}) {
  return { ...overrides };
}

export function createMockNext() {
  return jest.fn();
}

/* -------------------------------------------------------------------------- */
/* HTTP_OPTIONS helpers                                                       */
/* -------------------------------------------------------------------------- */

export const ORIGINAL_HTTP_OPTIONS = { ...HTTP_OPTIONS };
export function resetHttpOptions() {
  overrideHttpOptions({ ...ORIGINAL_HTTP_OPTIONS });
}
