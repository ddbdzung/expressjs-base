import safeStableStringify from 'safe-stable-stringify';

/**
 * src/core/helpers/response.helper.js
 * --------------------------------------------------
 * HttpResponse class extracted to avoid import cycles.
 */
import { HTTP_OPTIONS } from '../config/http-options.config.js';
import {
  HTTP_STATUS,
  getStatusText,
} from '../constants/http-status.constant.js';

// -----------------------------------------------------------------------------
// HttpResponse class (Express version)
// -----------------------------------------------------------------------------
export class HttpResponse {
  /**
   * @param {any}      data           - Payload for success or error details for failure
   * @param {string}   message        - Human-readable status message
   * @param {number}   statusCode     - HTTP status code
   * @param {object}   [meta]         - Additional metadata (correlationId, timestamp, etc.)
   */
  constructor(data, message, statusCode = HTTP_STATUS.OK, meta = {}) {
    this.data = data;
    this.message = message ?? getStatusText(statusCode);
    this.statusCode = statusCode;
    this.success = statusCode >= HTTP_STATUS.OK && statusCode < 300;

    // Enhanced metadata with automatic timestamp
    this.meta = {
      timestamp: new Date().toISOString(),
      ...meta,
    };
  }

  // ---------------------------------------------------------------------------
  // Factory methods
  // ---------------------------------------------------------------------------
  static success(
    data = null,
    message = 'Success',
    statusCode = HTTP_STATUS.OK,
    meta = {}
  ) {
    return new HttpResponse(data, message, statusCode, meta);
  }

  static error(
    message = 'Error',
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorDetails = null,
    meta = {}
  ) {
    return new HttpResponse(errorDetails, message, statusCode, meta);
  }

  static created(data = null, message = 'Created', meta = {}) {
    return HttpResponse.success(data, message, HTTP_STATUS.CREATED, meta);
  }

  static noContent(message = 'No Content', meta = {}) {
    return new HttpResponse(null, message, HTTP_STATUS.NO_CONTENT, meta);
  }

  static badRequest(message = 'Bad Request', errorDetails = null, meta = {}) {
    return HttpResponse.error(
      message,
      HTTP_STATUS.BAD_REQUEST,
      errorDetails,
      meta
    );
  }

  static unauthorized(
    message = 'Unauthorized',
    errorDetails = null,
    meta = {}
  ) {
    return HttpResponse.error(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      errorDetails,
      meta
    );
  }

  static forbidden(message = 'Forbidden', errorDetails = null, meta = {}) {
    return HttpResponse.error(
      message,
      HTTP_STATUS.FORBIDDEN,
      errorDetails,
      meta
    );
  }

  static notFound(message = 'Not Found', errorDetails = null, meta = {}) {
    return HttpResponse.error(
      message,
      HTTP_STATUS.NOT_FOUND,
      errorDetails,
      meta
    );
  }

  static conflict(message = 'Conflict', errorDetails = null, meta = {}) {
    return HttpResponse.error(
      message,
      HTTP_STATUS.CONFLICT,
      errorDetails,
      meta
    );
  }

  static validationError(
    message = 'Validation Failed',
    errors = [],
    meta = {}
  ) {
    const errorDetails = {
      type: 'validation',
      errors: Array.isArray(errors) ? errors : [errors],
    };
    return HttpResponse.badRequest(message, errorDetails, {
      errorType: 'validation',
      ...meta,
    });
  }

  static businessError(message, errorCode, details = null, meta = {}) {
    const errorDetails = {
      type: 'business',
      code: errorCode,
      details,
    };
    return HttpResponse.badRequest(message, errorDetails, {
      errorType: 'business',
      errorCode,
      ...meta,
    });
  }

  static paginated(
    data,
    { page = 1, limit = 10, total = 0 } = {},
    message = 'Success',
    meta = {}
  ) {
    const totalPages = Math.ceil(total / limit || 1);
    const paginationMeta = {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      ...meta,
    };
    return HttpResponse.success(data, message, HTTP_STATUS.OK, paginationMeta);
  }

  // ---------------------------------------------------------------------------
  // Utility methods
  // ---------------------------------------------------------------------------
  withCorrelationId(correlationId) {
    this.meta.correlationId = correlationId;
    return this;
  }

  withSource(source) {
    this.meta.source = source;
    return this;
  }

  withMeta(additionalMeta) {
    this.meta = { ...this.meta, ...additionalMeta };
    return this;
  }

  // ---------------------------------------------------------------------------
  // Express integration
  // ---------------------------------------------------------------------------
  /**
   * Send through an Express Response object.
   * @param {import('express').Response} res
   */
  send(res) {
    if (
      !res ||
      typeof res.status !== 'function' ||
      typeof res.json !== 'function'
    ) {
      throw new Error('Invalid Express response object');
    }

    const finalStatusCode = HTTP_OPTIONS.SET_DEFAULT_HTTP_STATUS_CODE
      ? HTTP_OPTIONS.DEFAULT_HTTP_STATUS_CODE
      : this.statusCode;

    const body = {
      success: this.success,
      message: this.message,
    };

    if (HTTP_OPTIONS.USE_STATUS_CODE_IN_RESPONSE) {
      body.statusCode = this.statusCode;
    }

    if (this.success) {
      if (this.data !== undefined && this.data !== null) {
        body.data = this.data;
      }
    } else if (this.data !== undefined && this.data !== null) {
      body.error = this.data;
    }

    if (this.meta && Object.keys(this.meta).length > 0) {
      body.meta = this.meta;
    }

    return res.status(finalStatusCode).type('application/json').send(body);
  }

  // ---------------------------------------------------------------------------
  // Generic utilities
  // ---------------------------------------------------------------------------
  toObject() {
    const obj = {
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
    };

    if (this.success) {
      if (this.data !== undefined && this.data !== null) obj.data = this.data;
    } else if (this.data !== undefined && this.data !== null) {
      obj.error = this.data;
    }

    if (this.meta && Object.keys(this.meta).length > 0) {
      obj.meta = this.meta;
    }

    return obj;
  }

  toJSON() {
    return safeStableStringify(this.toObject());
  }
}

export default {
  HttpResponse,
};
