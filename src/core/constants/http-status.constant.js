/**
 * core/constants/http-status.constant.js
 * --------------------------------------------------
 * Centralised, tree-shakeable constants for HTTP status codes & default texts.
 *
 * Uses Node.js built-in `http.STATUS_CODES` so we don't duplicate the full table.
 * Only a curated subset of numeric constants are exported for developer ergonomics
 * while the entire status-to-text map is exposed via `getStatusText()`.
 */
import { STATUS_CODES } from 'http';

import { safeGet } from '../utils/safe-get.util.js';

export const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 4xx Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,

  // 5xx Server errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Node exposes a mapping { '200': 'OK', ... }
export const HTTP_STATUS_TEXT = STATUS_CODES;

export function getStatusText(code) {
  return safeGet(STATUS_CODES, String(code), '');
}
