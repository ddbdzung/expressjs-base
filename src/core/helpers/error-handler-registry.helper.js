/**
 * src/core/helpers/error-handler-registry.helper.js
 * --------------------------------------------------
 * Extensible error handler registry system
 *
 * Allows business modules to register custom error handlers
 * without modifying core middleware code.
 */
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { HttpResponse } from './response.helper.js';

/**
 * Base exception class for operational errors
 */
export class BaseException extends Error {
  /**
   * Create a BaseException.
   * @param {string} message - Error message
   * @param {object} options - Error options
   * @param {number} options.statusCode - HTTP status code
   * @param {string} options.errorCode - Machine-readable error code
   * @param {boolean} options.isOperational - Whether this is an operational error
   * @param {string} options.correlationId - Request correlation ID
   * @param {object} options.metadata - Additional metadata
   * @param {any} options.data - Error data
   * @param {Error} options.cause - Original error cause
   */
  constructor(message = 'Error', options = {}) {
    // Ensure options is an object
    const { cause, ...opts } = options || {};
    super(message, cause ? { cause } : undefined);
    if (cause) this.cause = cause;

    this.statusCode = opts.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.errorCode = opts.errorCode;
    this.isOperational =
      opts.isOperational !== undefined ? Boolean(opts.isOperational) : true;
    this.correlationId = opts.correlationId;
    this.data = opts.data ?? null;
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...opts.metadata,
    };
    this.meta = this.metadata; // Alias for backward compatibility

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// const rootError = new Error("Database connection failed");
// const wrapped = new BaseException("User service failed", { cause: rootError });

// console.log(wrapped);
// BaseException { message: "User service failed", cause: Error: Database connection failed }

// const test = new BaseException(`User ${123} not found`, {
//   statusCode: HTTP_STATUS.NOT_FOUND,
//   errorCode: 'USER_NOT_FOUND',
// });

// console.log('test', test)

/**
 * Check if error is a BaseException
 */
export function isBaseException(err) {
  return err instanceof BaseException;
}

/**
 * Registry to store error handlers by exception type
 * Format: Map<constructor, handlerFunction>
 */
const errorHandlerRegistry = new Map();

/**
 * Default handler for BaseException
 */
function defaultBaseExceptionHandler(err, _req, _res) {
  const meta = {
    ...(err.metadata ?? err.meta ?? {}),
    ...(err.errorCode !== undefined ? { errorCode: err.errorCode } : {}),
    ...(err.isOperational !== undefined
      ? { isOperational: err.isOperational }
      : {}),
    ...(err.correlationId !== undefined
      ? { correlationId: err.correlationId }
      : {}),
  };

  return HttpResponse.error(
    err.message,
    err.statusCode ?? HTTP_STATUS.BAD_REQUEST,
    err.data,
    meta
  );
}

/**
 * Register a custom error handler for a specific exception type
 * @param {Function} ExceptionClass - The exception constructor
 * @param {Function} handler - Handler function (err, req, res) => HttpResponse
 */
export function registerErrorHandler(ExceptionClass, handler) {
  if (typeof ExceptionClass !== 'function') {
    throw new Error('ExceptionClass must be a constructor function');
  }
  if (typeof handler !== 'function') {
    throw new Error('Handler must be a function');
  }

  errorHandlerRegistry.set(ExceptionClass, handler);
}

/**
 * Find the appropriate handler for an error
 * Uses prototype chain to find the most specific handler
 * @param {Error} err - The error instance
 * @returns {Function|null} - Handler function or null if not found
 */
export function findErrorHandler(err) {
  // Check for exact match first
  for (const [ExceptionClass, handler] of errorHandlerRegistry) {
    if (err.constructor === ExceptionClass) {
      return handler;
    }
  }

  // Check inheritance chain
  for (const [ExceptionClass, handler] of errorHandlerRegistry) {
    if (err instanceof ExceptionClass) {
      return handler;
    }
  }

  return null;
}

/**
 * Create safe fallback response when error handler fails
 * Preserves original error context while providing safe response
 *
 * @param {Error} originalError - The original business error
 * @param {Error} handlerError - Error thrown by the handler
 * @param {Object} req - Express request object (optional)
 * @returns {HttpResponse} Safe fallback response
 */
function createFallbackResponse(originalError, handlerError, req = null) {
  // Structured logging for monitoring and debugging
  const logContext = {
    originalError: {
      name: originalError?.name || 'UnknownError',
      message: originalError?.message || 'Unknown error occurred',
      statusCode: originalError?.statusCode,
      errorCode: originalError?.errorCode,
      isOperational: originalError?.isOperational,
    },
    handlerError: {
      name: handlerError?.name || 'HandlerError',
      message: handlerError?.message || 'Handler execution failed',
      stack: handlerError?.stack?.split('\n')?.[0], // First line only
    },
    request: req
      ? {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get?.('user-agent'),
        }
      : null,
    timestamp: new Date().toISOString(),
  };

  // Log with appropriate level based on error type
  if (originalError?.isOperational === false) {
    console.error('[HANDLER_FAILURE_SYSTEM]', logContext);
  } else {
    console.warn('[HANDLER_FAILURE_BUSINESS]', logContext);
  }

  // Determine appropriate status code for fallback
  const fallbackStatusCode =
    originalError?.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Create safe fallback message based on original error type
  let fallbackMessage;
  if (fallbackStatusCode === HTTP_STATUS.NOT_FOUND) {
    fallbackMessage = 'Requested resource not found';
  } else if (fallbackStatusCode === HTTP_STATUS.BAD_REQUEST) {
    fallbackMessage = 'Invalid request data';
  } else if (fallbackStatusCode === HTTP_STATUS.FORBIDDEN) {
    fallbackMessage = 'Access denied';
  } else if (fallbackStatusCode === HTTP_STATUS.CONFLICT) {
    fallbackMessage = 'Resource conflict occurred';
  } else {
    fallbackMessage = 'Service temporarily unavailable';
  }

  // Preserve important metadata from original error
  const safeMeta = {
    errorCode: 'HANDLER_EXECUTION_FAILED',
    originalErrorCode: originalError?.errorCode,
    correlationId: originalError?.correlationId || generateSafeCorrelationId(),
    timestamp: new Date().toISOString(),
    retryable: isRetryableError(originalError),
    // Include domain if available for client routing/handling
    ...(originalError?.metadata?.domain && {
      domain: originalError.metadata.domain,
    }),
  };

  return HttpResponse.error(
    fallbackMessage,
    fallbackStatusCode,
    null, // No sensitive data in fallback response
    safeMeta
  );
}

/**
 * Determine if error should be retryable by client
 * @param {Error} error - Original error
 * @returns {boolean} Whether the error is retryable
 */
function isRetryableError(error) {
  // Non-retryable errors (client errors)
  const nonRetryableStatusCodes = [
    HTTP_STATUS.BAD_REQUEST,
    HTTP_STATUS.UNAUTHORIZED,
    HTTP_STATUS.FORBIDDEN,
    HTTP_STATUS.NOT_FOUND,
    HTTP_STATUS.CONFLICT,
  ];

  if (error?.statusCode && nonRetryableStatusCodes.includes(error.statusCode)) {
    return false;
  }

  // Default to retryable for server errors or unknown errors
  return true;
}

/**
 * Generate safe correlation ID for fallback responses
 * @returns {string} Correlation ID
 */
function generateSafeCorrelationId() {
  return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * Safe wrapper for error handlers
 * Prevents handler failures from breaking error flow
 *
 * @param {Function} handler - Original error handler
 * @param {Object} options - Wrapper options
 * @param {string} options.handlerName - Name for logging
 * @returns {Function} Safe wrapped handler
 */
function createSafeHandler(handler, options = {}) {
  const { handlerName = 'anonymous' } = options;

  return function safeHandlerWrapper(err, req, res) {
    try {
      // Execute original handler
      const result = handler(err, req, res);

      // Handle promise-based handlers
      if (result && typeof result.then === 'function') {
        return result.catch(handlerError => {
          console.error(`[ASYNC_HANDLER_FAILURE] ${handlerName}:`, {
            originalError: err?.message,
            handlerError: handlerError?.message,
            path: req?.path,
          });
          return createFallbackResponse(err, handlerError, req);
        });
      }

      return result;
    } catch (handlerError) {
      console.error(`[SYNC_HANDLER_FAILURE] ${handlerName}:`, {
        originalError: err?.message,
        handlerError: handlerError?.message,
        path: req?.path,
      });

      return createFallbackResponse(err, handlerError, req);
    }
  };
}

/**
 * Handle error using registry with safe wrapper
 * @param {Error} err - The error instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Options for safe handling
 * @param {boolean} options.useSafeWrapper - Whether to use safe wrapper (default: true)
 * @returns {HttpResponse|null} - HttpResponse instance or null if no handler found
 */
export function handleWithRegistry(err, req, res, options = {}) {
  const { useSafeWrapper = true } = options;

  const handler = findErrorHandler(err);
  if (!handler) return null;

  // Use safe wrapper by default to prevent handler failures
  if (useSafeWrapper) {
    const safeHandler = createSafeHandler(handler, {
      handlerName: `${err.constructor.name}Handler`,
    });
    return safeHandler(err, req, res);
  }

  // Direct handler execution (for testing or special cases)
  return handler(err, req, res);
}

/**
 * Get all registered error handlers (for debugging)
 * @returns {Map} - Copy of the registry
 */
export function getRegisteredHandlers() {
  return new Map(errorHandlerRegistry);
}

/**
 * Clear all registered handlers (mainly for testing)
 */
export function clearRegistry() {
  errorHandlerRegistry.clear();
}

/**
 * Setup default handlers with safe wrappers
 * Call this during bootstrap to register core exception handlers
 */
export function setupDefaultHandlers(options = {}) {
  const { useSafeWrapper = true } = options;

  if (useSafeWrapper) {
    const safeDefaultHandler = createSafeHandler(defaultBaseExceptionHandler, {
      handlerName: 'BaseExceptionHandler',
    });
    registerErrorHandler(BaseException, safeDefaultHandler);
  } else {
    registerErrorHandler(BaseException, defaultBaseExceptionHandler);
  }
}

// Export individual utility functions
export { createSafeHandler, createFallbackResponse };

export default {
  BaseException,
  isBaseException,
  registerErrorHandler,
  findErrorHandler,
  handleWithRegistry,
  getRegisteredHandlers,
  clearRegistry,
  setupDefaultHandlers,
  createSafeHandler,
  createFallbackResponse,
};
