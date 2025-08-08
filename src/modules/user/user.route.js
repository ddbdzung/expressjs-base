/**
 * src/modules/user/user.route.js
 * --------------------------------------------------
 * User module routes demonstrating normalized response format
 */
import { Router } from 'express';

import { HTTP_STATUS } from '../../core/constants/http-status.constant.js';
import {
  HttpResponse,
  wrapController,
} from '../../core/helpers/http.helper.js';
import {
  UserNotFoundException,
  UserPermissionException,
  UserStateException,
  UserValidationException,
} from './exceptions/user.exceptions.js';

const router = Router();

// Demo: Success response with normalized format
router.get(
  '/success-demo',
  wrapController(async () => {
    return {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
    };
  })
);

// Demo: Success response with meta
router.get(
  '/success-with-meta',
  wrapController(async req => {
    const response = HttpResponse.success(
      {
        users: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' },
        ],
      },
      'Users retrieved successfully',
      HTTP_STATUS.OK,
      {
        correlationId: `req_${Date.now()}`,
        source: 'user-service',
        timestamp: new Date().toISOString(),
      }
    );

    return response;
  })
);

// Demo: UserNotFoundException with normalized error format
router.get(
  '/not-found/:id',
  wrapController(async req => {
    const { id } = req.params;
    // Always throw not found for demo
    throw new UserNotFoundException(id, {
      correlationId: `req_${Date.now()}`,
    });
  })
);

// Demo: UserValidationException with structured error
router.post(
  '/validate-demo',
  wrapController(async req => {
    const { email, username } = req.body;

    if (!email) {
      throw new UserValidationException('email', email, 'required', {
        correlationId: `val_${Date.now()}`,
      });
    }

    if (email && !email.includes('@')) {
      throw new UserValidationException('email', email, 'format', {
        correlationId: `val_${Date.now()}`,
      });
    }

    if (username && username.length < 3) {
      throw new UserValidationException('username', username, 'length', {
        correlationId: `val_${Date.now()}`,
      });
    }

    return HttpResponse.success(
      { message: 'Validation passed' },
      'User data is valid',
      HTTP_STATUS.OK,
      {
        validatedFields: ['email', 'username'],
        timestamp: new Date().toISOString(),
      }
    );
  })
);

// Demo: UserPermissionException with security context
router.delete(
  '/admin-action/:id',
  wrapController(async req => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] || 'user';

    if (userRole !== 'admin') {
      throw new UserPermissionException(
        'current_user',
        'delete',
        `user:${id}`,
        {
          correlationId: `perm_${Date.now()}`,
        }
      );
    }

    return HttpResponse.success(
      null,
      'User deleted successfully',
      HTTP_STATUS.OK,
      {
        deletedUserId: id,
        performedBy: 'admin',
        timestamp: new Date().toISOString(),
      }
    );
  })
);

// Demo: UserStateException with transition guidance
router.post(
  '/activate/:id',
  wrapController(async req => {
    const { id } = req.params;

    // Simulate different user states
    const userStates = {
      suspended: 'suspended',
      pending: 'pending',
      inactive: 'inactive',
      deleted: 'deleted',
    };

    const currentState = userStates[id] || 'active';

    if (currentState !== 'inactive') {
      throw new UserStateException(id, currentState, 'active', 'activation', {
        correlationId: `state_${Date.now()}`,
      });
    }

    return HttpResponse.success(
      { userId: id, newState: 'active' },
      'User activated successfully',
      HTTP_STATUS.OK,
      {
        previousState: currentState,
        timestamp: new Date().toISOString(),
      }
    );
  })
);

// Demo: Paginated response
router.get(
  '/paginated',
  wrapController(async req => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const total = 150; // Mock total

    // Mock data
    const users = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      name: `User ${(page - 1) * limit + i + 1}`,
      email: `user${(page - 1) * limit + i + 1}@example.com`,
    }));

    return HttpResponse.paginated(
      users,
      { page, limit, total },
      'Users retrieved successfully',
      {
        correlationId: `req_${Date.now()}`,
        source: 'user-service',
      }
    );
  })
);

// Demo: Multiple error types in one endpoint
router.post(
  '/comprehensive-demo',
  wrapController(async req => {
    const { action, userId, userRole } = req.body;

    // Validation errors
    if (!action) {
      throw new UserValidationException('action', action, 'required');
    }

    if (!userId) {
      throw new UserValidationException('userId', userId, 'required');
    }

    // Permission errors
    if (action === 'delete' && userRole !== 'admin') {
      throw new UserPermissionException(userRole, 'delete', `user:${userId}`);
    }

    // Not found errors
    if (userId === '404') {
      throw new UserNotFoundException(userId);
    }

    // State errors
    if (action === 'activate' && userId === 'suspended') {
      throw new UserStateException(userId, 'suspended', 'active', 'activation');
    }

    // Success case
    return HttpResponse.success(
      {
        action: action,
        userId: userId,
        result: 'completed',
      },
      'Action completed successfully',
      HTTP_STATUS.OK,
      {
        performedBy: userRole,
        timestamp: new Date().toISOString(),
      }
    );
  })
);

export default router;
