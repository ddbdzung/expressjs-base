/**
 * src/modules/user/user.module.js
 * --------------------------------------------------
 * User module initialization and registration
 *
 * Registers all user-specific components including
 * exception handlers, middleware, routes, etc.
 */
import { registerErrorHandler } from '../../core/helpers/error-handler-registry.helper.js';
// Import domain exceptions
import {
  handleUserNotFound,
  handleUserPermission,
  handleUserState,
  handleUserValidation,
} from './error-handlers/user.error-handlers.js';
import {
  UserNotFoundException,
  UserPermissionException,
  UserStateException,
  UserValidationException,
} from './exceptions/user.exceptions.js';

export { default as userRoutes } from './user.route.js';

// Import custom error handlers

/**
 * Initialize the User module
 * Registers all error handlers and sets up module components
 */
export function initializeUserModule() {
  // Register exception handlers
  registerErrorHandler(UserNotFoundException, handleUserNotFound);
  // registerErrorHandler(UserValidationException, handleUserValidation);
  registerErrorHandler(UserPermissionException, handleUserPermission);
  registerErrorHandler(UserStateException, handleUserState);

  console.log('[USER_MODULE] Error handlers registered');
}

/**
 * Get all user exception classes for external use
 */
export function getUserExceptions() {
  return {
    UserNotFoundException,
    UserValidationException,
    UserPermissionException,
    UserStateException,
  };
}

/**
 * Module metadata
 */
export const userModuleInfo = {
  name: 'user',
  version: '1.0.0',
  domain: 'user-management',
  exceptionTypes: [
    'UserNotFoundException',
    'UserValidationException',
    'UserPermissionException',
    'UserStateException',
  ],
};

export default {
  initializeUserModule,
  getUserExceptions,
  userModuleInfo,
};
