import express from 'express';

import { HTTP_OPTIONS } from './core/config/http-options.config.js';
import {
  HTTP_STATUS,
  getStatusText,
} from './core/constants/http-status.constant.js';
import { setupDefaultHandlers } from './core/helpers/error-handler-registry.helper.js';
// BaseException moved to error-handler-registry for cleaner architecture
import { HttpResponse, wrapController } from './core/helpers/http.helper.js';
import globalErrorHandler from './core/middlewares/error-handler.middleware.js';
// Import business modules
import defineConstModule from './core/utils/define-const.util.js';
import { safeGet } from './core/utils/safe-get.util.js';
import {
  getType,
  isArray,
  isEmail,
  isEmpty,
  isPlainObject,
  isURL,
} from './core/utils/type-check.util.js';
import {
  getUserExceptions,
  initializeUserModule,
  userRoutes,
} from './modules/user/user.module.js';

const { defineConst } = defineConstModule;

const app = express();

app.use(express.json());

// Initialize error handling system
setupDefaultHandlers();

// Initialize business modules
initializeUserModule();

app.use('/users', userRoutes);

// Success: plain object → HttpResponse.success 200
app.get(
  '/',
  wrapController(async () => ({ status: 'ok' }))
);

// Success: explicit HttpResponse
app.get(
  '/success-response',
  wrapController(async () => HttpResponse.success({ hello: 'world' }, 'OK'))
);

// Success: paginated response
app.get(
  '/paginated',
  wrapController(async () =>
    HttpResponse.paginated(
      [{ id: 1 }, { id: 2 }],
      { page: 1, limit: 2, total: 5 },
      'List'
    )
  )
);

// Constants: getStatusText usage
app.get(
  '/status-text/:code',
  wrapController(async req => {
    const code = Number(req.params.code);
    return { code, text: getStatusText(code) };
  })
);

// Config: expose current HTTP_OPTIONS
app.get(
  '/http-options',
  wrapController(async () => ({ options: HTTP_OPTIONS }))
);

// Utils: safeGet usage
app.get(
  '/safe-get-demo',
  wrapController(async () => {
    const obj = { a: { b: 'c' }, empty: {} };
    return {
      fromNested: safeGet(obj.a, 'b', 'default'),
      missing: safeGet(obj, 'missing', 'default'),
      emptyHasX: safeGet(obj.empty, 'x', null),
    };
  })
);

// Utils: type-check usage
app.get(
  '/type-check',
  wrapController(async () => ({
    isEmailSample: isEmail('user@example.com'),
    isURLSample: isURL('https://example.com'),
    isArraySample: isArray([1, 2, 3]),
    isEmptyObject: isEmpty({}),
    typeOfDate: getType(new Date()),
    isPlainObjectSample: isPlainObject({ x: 1 }),
  }))
);

// Utils: defineConst (deepFreeze) usage
app.get(
  '/define-const',
  wrapController(async () => {
    const frozen = defineConst({ a: { b: 1 } });
    let mutateError = null;
    try {
      // Attempt to mutate deep property
      frozen.a.b = 2;
    } catch (e) {
      mutateError = e.message;
    }
    return {
      frozen,
      mutateError,
      valueAfterAttempt: frozen.a.b,
    };
  })
);

// Error: throw HttpResponse → forwarded to next(); handled by globalErrorHandler
app.get(
  '/throw-http-response',
  wrapController(async () => {
    throw HttpResponse.error('Bad input', HTTP_STATUS.BAD_REQUEST);
  })
);

// Error: Raw BaseException example
app.get(
  '/base-exception',
  wrapController(async () => {
    const { BaseException } = await import(
      './core/helpers/error-handler-registry.helper.js'
    );
    throw new BaseException('Invalid payload', {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: 'E_BAD_REQ',
      metadata: { field: 'name' },
    });
  })
);

// Legacy examples removed - use business module patterns instead

// =================== BUSINESS MODULE DEMOS ===================

const {
  UserNotFoundException,
  UserValidationException,
  UserPermissionException,
  UserStateException,
} = getUserExceptions();

// Demo: User not found with custom handler
app.get(
  '/user/:id',
  wrapController(async req => {
    const { id } = req.params;
    // Simulate user lookup
    if (id === '404') {
      throw new UserNotFoundException(id, {
        correlationId: `req_${Date.now()}`,
      });
    }
    return { user: { id, name: 'John Doe' } };
  })
);

// Demo: User validation with business rules
app.post(
  '/user/validate',
  wrapController(async req => {
    const { email, username } = req.body;

    // Simulate business validation
    if (email === 'taken@example.com') {
      throw new UserValidationException('email', email, 'unique', {
        correlationId: `val_${Date.now()}`,
      });
    }

    if (username && username.length < 3) {
      throw new UserValidationException('username', username, 'length');
    }

    return { message: 'Validation passed' };
  })
);

// Demo: User permission check
app.delete(
  '/user/:id/admin-delete',
  wrapController(async req => {
    const { id } = req.params;
    const currentUserId = req.headers['x-user-id'] || 'guest';

    // Simulate permission check
    if (currentUserId !== 'admin') {
      throw new UserPermissionException(currentUserId, 'delete', `user:${id}`, {
        correlationId: `perm_${Date.now()}`,
      });
    }

    return { message: 'User deleted successfully' };
  })
);

// Demo: User state validation
app.post(
  '/user/:id/activate',
  wrapController(async req => {
    const { id } = req.params;

    // Simulate user state check
    const userStates = {
      u1: 'suspended',
      u2: 'pending',
      u3: 'inactive',
    };

    const currentState = userStates[id] || 'unknown';

    if (currentState === 'suspended') {
      throw new UserStateException(id, currentState, 'active', 'activation');
    }

    if (currentState === 'pending') {
      throw new UserStateException(id, currentState, 'active', 'activation', {
        correlationId: `state_${Date.now()}`,
      });
    }

    return { message: 'User activated successfully' };
  })
);

// Error: no return with STRICT_CONTROLLER_RETURN=true → throws BaseException (forwarded)
app.get(
  '/no-return',
  wrapController(async () => {
    return undefined;
  })
);

// Error: direct res.send is blocked by proxy (unless allowRes)
app.get(
  '/proxy-block',
  wrapController((_req, res) => {
    res.send('should not send');
  })
);

// Special: allow direct res access
app.get(
  '/allow-res',
  wrapController(
    (_req, res) => {
      res.status(201).type('text/plain').send('free');
    },
    { allowRes: true }
  )
);

// Global error handler must be the last middleware
app.use(globalErrorHandler);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export default app;
