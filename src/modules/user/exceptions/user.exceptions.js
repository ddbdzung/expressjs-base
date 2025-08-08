/**
 * src/modules/user/exceptions/user.exceptions.js
 * --------------------------------------------------
 * Business-specific exception types for User domain
 *
 * These are domain exceptions that extend BaseException
 * with specific business context and custom error handling.
 */
import { HTTP_STATUS } from '../../../core/constants/http-status.constant.js';
import { BaseException } from '../../../core/helpers/error-handler-registry.helper.js';

/**
 * User not found exception
 * Represents when a user entity cannot be located
 */
export class UserNotFoundException extends BaseException {
  constructor(identifier, options = {}) {
    const message = `User not found: ${identifier}`;
    super(message, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      errorCode: 'USER_NOT_FOUND',
      ...options,
      metadata: {
        domain: 'user',
        identifier,
        ...options.metadata,
      },
    });
    this.name = 'UserNotFoundException';
  }
}

/**
 * User validation exception
 * For business rule validation (not input validation)
 */
export class UserValidationException extends BaseException {
  constructor(field, value, rule, options = {}) {
    const message = `User validation failed: ${field} ${rule}`;
    super(message, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: 'USER_VALIDATION_ERROR',
      ...options,
      data: {
        field,
        value,
        rule,
        ...options.data,
      },
      metadata: {
        domain: 'user',
        validationType: 'business',
        ...options.metadata,
      },
    });
    this.name = 'UserValidationException';
  }
}

/**
 * User permission exception
 * When user lacks permission for an operation
 */
export class UserPermissionException extends BaseException {
  constructor(userId, action, resource, options = {}) {
    const message = `User ${userId} lacks permission for ${action} on ${resource}`;
    super(message, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      errorCode: 'USER_PERMISSION_DENIED',
      ...options,
      data: {
        userId,
        action,
        resource,
        ...options.data,
      },
      metadata: {
        domain: 'user',
        securityContext: true,
        ...options.metadata,
      },
    });
    this.name = 'UserPermissionException';
  }
}

/**
 * User state exception
 * When user is in invalid state for operation
 */
export class UserStateException extends BaseException {
  constructor(userId, currentState, requiredState, operation, options = {}) {
    const message = `User ${userId} is ${currentState}, requires ${requiredState} for ${operation}`;
    super(message, {
      statusCode: HTTP_STATUS.CONFLICT,
      errorCode: 'USER_INVALID_STATE',
      ...options,
      data: {
        userId,
        currentState,
        requiredState,
        operation,
        ...options.data,
      },
      metadata: {
        domain: 'user',
        stateTransition: true,
        ...options.metadata,
      },
    });
    this.name = 'UserStateException';
  }
}
