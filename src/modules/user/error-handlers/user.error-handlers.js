/**
 * src/modules/user/error-handlers/user.error-handlers.js
 * --------------------------------------------------
 * Custom error handlers for User domain exceptions
 *
 * Each handler defines how to transform domain exceptions
 * into HTTP responses with appropriate logging/monitoring.
 */
import { HTTP_STATUS } from '../../../core/constants/http-status.constant.js';
import { HttpResponse } from '../../../core/helpers/http.helper.js';
import { safeGet } from '../../../core/utils/safe-get.util.js';

/**
 * Handler for UserNotFoundException
 * Provides specific response format for user lookup failures
 */
export function handleUserNotFound(err, req, _res) {
  // Log for monitoring (could be replaced with proper logger)
  console.log(
    `[USER_NOT_FOUND] ${err.metadata.identifier} - Path: ${req.path}`
  );

  return HttpResponse.error(
    'User not found',
    HTTP_STATUS.NOT_FOUND,
    {
      type: 'user_not_found',
      details: {
        suggestion: 'Please check the user identifier and try again',
        searchedFor: err.metadata.identifier,
      },
    },
    {
      errorCode: err.errorCode,
      domain: err.metadata.domain,
      correlationId: err.correlationId,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Handler for UserValidationException
 * Provides detailed validation feedback
 */
export function handleUserValidation(err, _req, _res) {
  console.log(
    `[USER_VALIDATION] Field: ${err.data.field}, Rule: ${err.data.rule}`
  );

  return HttpResponse.error(
    'User validation failed',
    HTTP_STATUS.BAD_REQUEST,
    {
      type: 'validation_error',
      field: err.data.field,
      rule: err.data.rule,
      value: err.data.value,
      suggestions: getValidationSuggestions(err.data.field, err.data.rule),
    },
    {
      errorCode: err.errorCode,
      domain: err.metadata.domain,
      validationType: err.metadata.validationType,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Handler for UserPermissionException
 * Provides security-aware response without exposing sensitive info
 */
export function handleUserPermission(err, req, _res) {
  // Enhanced security logging
  console.warn(
    `[SECURITY] Permission denied - User: ${err.data.userId}, Action: ${err.data.action}, Resource: ${err.data.resource}, IP: ${req.ip}`
  );

  return HttpResponse.error(
    'Access denied',
    HTTP_STATUS.FORBIDDEN,
    {
      type: 'permission_denied',
      message: 'You do not have permission to perform this action',
      // Don't expose detailed permission info to client
    },
    {
      errorCode: err.errorCode,
      domain: err.metadata.domain,
      correlationId: err.correlationId || generateCorrelationId(),
      securityEvent: true,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Handler for UserStateException
 * Provides state transition guidance
 */
export function handleUserState(err, _req, _res) {
  console.log(
    `[USER_STATE] User: ${err.data.userId}, State: ${err.data.currentState} -> ${err.data.requiredState}`
  );

  return HttpResponse.error(
    'Invalid user state for operation',
    HTTP_STATUS.CONFLICT,
    {
      type: 'invalid_state',
      currentState: err.data.currentState,
      requiredState: err.data.requiredState,
      operation: err.data.operation,
      possibleActions: getStateTransitionActions(
        err.data.currentState,
        err.data.requiredState
      ),
    },
    {
      errorCode: err.errorCode,
      domain: err.metadata.domain,
      retryable: isRetryableStateTransition(
        err.data.currentState,
        err.data.requiredState
      ),
      timestamp: new Date().toISOString(),
    }
  );
}

// Helper functions
function getValidationSuggestions(field, rule) {
  const suggestions = {
    email: {
      format: ['Use valid email format: user@domain.com'],
      unique: [
        'This email is already registered',
        'Try a different email address',
      ],
    },
    username: {
      length: ['Username must be 3-20 characters'],
      format: ['Use only letters, numbers, and underscores'],
      unique: ['This username is taken', 'Try adding numbers or underscores'],
    },
  };

  return (
    safeGet(safeGet(suggestions, field, {}), rule, '') || [
      'Please check the input and try again',
    ]
  );
}

function getStateTransitionActions(currentState, requiredState) {
  const transitions = {
    inactive: {
      active: ['Verify email address', 'Complete profile setup'],
    },
    suspended: {
      active: ['Contact support for account review'],
    },
    pending: {
      active: ['Wait for account approval'],
    },
  };

  return (
    safeGet(safeGet(transitions, currentState, {}), requiredState, []) || [
      'Contact support for assistance',
    ]
  );
}

function isRetryableStateTransition(currentState, _requiredState) {
  const retryableTransitions = ['pending', 'processing'];
  return retryableTransitions.includes(currentState);
}

function generateCorrelationId() {
  return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
