# Error Handler Registry Pattern

## Tổng quan

Pattern này cho phép business modules định nghĩa custom exception types và error handlers mà **không cần sửa core code**. Core layer chỉ cung cấp registry mechanism, business modules tự register handlers.

## Kiến trúc

```
src/
├── core/
│   ├── helpers/
│   │   ├── exception.helper.js          # BaseException
│   │   └── error-handler-registry.helper.js  # Registry system
│   └── middlewares/
│       └── error-handler.middleware.js  # Uses registry
└── modules/
    └── user/
        ├── exceptions/
        │   └── user.exceptions.js       # Business exceptions
        ├── error-handlers/
        │   └── user.error-handlers.js   # Custom handlers
        └── user.module.js               # Register handlers
```

## Cách thức hoạt động

### 1. Registry System (Core)

```js
// Core provides registry mechanism
import { registerErrorHandler } from '../../core/helpers/error-handler-registry.helper.js';

// Business modules register handlers
registerErrorHandler(UserNotFoundException, handleUserNotFound);
```

### 2. Error Handler Middleware (Core)

```js
export default function globalErrorHandler(err, req, res, next) {
  // 1. Check HttpResponse
  if (err instanceof HttpResponse) return err.send(res);
  
  // 2. Check registry for custom handlers ← NEW
  const customResponse = handleWithRegistry(err, req, res);
  if (customResponse) return customResponse.send(res);
  
  // 3. Fallback to BaseException default
  if (err instanceof BaseException) { /* default handling */ }
  
  // 4. Unknown errors
  /* ... */
}
```

### 3. Business Module Pattern

```js
// modules/user/user.module.js
export function initializeUserModule() {
  registerErrorHandler(UserNotFoundException, handleUserNotFound);
  registerErrorHandler(UserValidationException, handleUserValidation);
  // ... register other handlers
}
```

## Lợi ích

### ✅ **Không sửa Core**
- Core chỉ export registry mechanism
- Business logic hoàn toàn tách biệt
- Core middleware không cần biết về business exceptions

### ✅ **Tránh If/Else Chain**
```js
// ❌ Old way
if (err instanceof UserNotFoundException) {
  // handle user not found
} else if (err instanceof ProductNotFoundException) {
  // handle product not found  
} else if (err instanceof OrderException) {
  // handle order exception
}

// ✅ New way - Registry handles lookup
const handler = findErrorHandler(err);
if (handler) return handler(err, req, res);
```

### ✅ **Type-Specific Handling**
- Mỗi exception type có handler riêng
- Custom logging, monitoring, response format
- Business context trong error response

### ✅ **Scalable**
- Thêm module mới không ảnh hưởng core
- Inheritance-aware (tìm handler cho parent classes)
- Easy testing và mocking

## Usage Examples

### Định nghĩa Exception

```js
// modules/user/exceptions/user.exceptions.js
export class UserNotFoundException extends BaseException {
  constructor(identifier, options = {}) {
    super(`User not found: ${identifier}`, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      errorCode: 'USER_NOT_FOUND',
      metadata: { domain: 'user', identifier },
      ...options,
    });
  }
}
```

### Định nghĩa Handler

```js
// modules/user/error-handlers/user.error-handlers.js
export function handleUserNotFound(err, req, res) {
  console.log(`[USER_NOT_FOUND] ${err.metadata.identifier} - Path: ${req.path}`);
  
  return HttpResponse.error('User not found', HTTP_STATUS.NOT_FOUND, {
    suggestion: 'Please check the user identifier',
    searchedFor: err.metadata.identifier,
  }, {
    errorCode: err.errorCode,
    domain: err.metadata.domain,
  });
}
```

### Register Handler

```js
// modules/user/user.module.js
import { registerErrorHandler } from '../../core/helpers/error-handler-registry.helper.js';

export function initializeUserModule() {
  registerErrorHandler(UserNotFoundException, handleUserNotFound);
}
```

### Sử dụng trong Controller

```js
app.get('/user/:id', wrapController(async (req) => {
  const user = await findUser(req.params.id);
  if (!user) {
    throw new UserNotFoundException(req.params.id, {
      correlationId: `req_${Date.now()}`,
    });
  }
  return user;
}));
```

## Demo Endpoints

```bash
# User not found với custom handler
GET /user/404

# Validation error với business rules
POST /user/validate
Body: { "email": "taken@example.com" }

# Permission denied với security logging
DELETE /user/123/admin-delete
Headers: x-user-id: guest

# State transition error với guidance
POST /user/u1/activate
```

## Best Practices

### 1. **Naming Convention**
```js
// Exception: [Domain][Entity][Action]Exception
UserNotFoundException
ProductValidationException
OrderProcessingException

// Handler: handle[Domain][Entity][Action]
handleUserNotFound
handleProductValidation
handleOrderProcessing
```

### 2. **Error Response Structure**
```js
return HttpResponse.error(message, statusCode, data, meta);

// data: user-facing information, suggestions
// meta: technical metadata, error codes, correlation IDs
```

### 3. **Security Considerations**
```js
export function handleUserPermission(err, req, res) {
  // Enhanced logging for security events
  console.warn(`[SECURITY] Permission denied - User: ${err.data.userId}, IP: ${req.ip}`);
  
  // Don't expose sensitive information to client
  return HttpResponse.error('Access denied', HTTP_STATUS.FORBIDDEN, {
    message: 'You do not have permission to perform this action',
    // Don't include detailed permission info
  });
}
```

### 4. **Module Organization**
```
modules/[domain]/
├── exceptions/           # Domain-specific exceptions
├── error-handlers/       # Custom error handlers  
├── controllers/          # Request handlers
├── services/            # Business logic
└── [domain].module.js   # Module initialization
```

## Testing

```js
// Test exception
it('should throw UserNotFoundException', () => {
  expect(() => {
    throw new UserNotFoundException('user123');
  }).toThrow('User not found: user123');
});

// Test handler registration
it('should register handler correctly', () => {
  registerErrorHandler(UserNotFoundException, handleUserNotFound);
  const handler = findErrorHandler(new UserNotFoundException('test'));
  expect(handler).toBe(handleUserNotFound);
});
```

## Kết luận

Pattern này cung cấp:
- **Separation of concerns** giữa core và business
- **Extensibility** mà không sửa core code  
- **Type safety** và custom handling
- **Scalable architecture** cho production systems

Business modules có thể định nghĩa exception types và handlers riêng, trong khi core layer chỉ cung cấp infrastructure để registry và dispatch errors.
