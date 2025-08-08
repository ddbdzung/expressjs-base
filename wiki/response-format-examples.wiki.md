# Normalized Response Format Examples

## Overview

All API responses now follow a consistent normalized format with clear separation between success and error states.

## Response Structure

```js
{
  statusCode?: number;    // HTTP status code (optional based on config)
  success: boolean;       // true for success, false for error
  message: string;        // Human-readable message
  data?: any;            // Only present when success = true
  error?: any;           // Only present when success = false
  meta?: any;            // Metadata (correlationId, timestamp, etc.)
}
```

## Success Response Examples

### Simple Success
```bash
GET /users/success-demo
```

**Response:**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active"
  }
}
```

### Success with Metadata
```bash
GET /users/success-with-meta
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      { "id": 1, "name": "John Doe" },
      { "id": 2, "name": "Jane Smith" }
    ]
  },
  "meta": {
    "correlationId": "req_1704110400000",
    "source": "user-service",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Paginated Response
```bash
GET /users/paginated?page=2&limit=5
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    { "id": 6, "name": "User 6", "email": "user6@example.com" },
    { "id": 7, "name": "User 7", "email": "user7@example.com" }
  ],
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 5,
      "total": 150,
      "totalPages": 30,
      "hasNext": true,
      "hasPrev": true
    },
    "correlationId": "req_1704110400001",
    "source": "user-service"
  }
}
```

### No Content Success
```bash
DELETE /users/123
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "meta": {
    "deletedUserId": "123",
    "performedBy": "admin",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Error Response Examples

### User Not Found
```bash
GET /users/not-found/999
```

**Response:**
```json
{
  "success": false,
  "message": "User not found",
  "error": {
    "type": "user_not_found",
    "details": {
      "suggestion": "Please check the user identifier and try again",
      "searchedFor": "999"
    }
  },
  "meta": {
    "errorCode": "USER_NOT_FOUND",
    "domain": "user",
    "correlationId": "req_1704110400002",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Validation Error
```bash
POST /users/validate-demo
Content-Type: application/json

{
  "email": "invalid-email",
  "username": "ab"
}
```

**Response:**
```json
{
  "success": false,
  "message": "User validation failed",
  "error": {
    "type": "validation_error",
    "field": "email",
    "rule": "format",
    "value": "invalid-email",
    "suggestions": ["Use valid email format: user@domain.com"]
  },
  "meta": {
    "errorCode": "USER_VALIDATION_ERROR",
    "domain": "user",
    "validationType": "business",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Permission Denied
```bash
DELETE /users/admin-action/123
X-User-Role: user
```

**Response:**
```json
{
  "success": false,
  "message": "Access denied",
  "error": {
    "type": "permission_denied",
    "message": "You do not have permission to perform this action"
  },
  "meta": {
    "errorCode": "USER_PERMISSION_DENIED",
    "domain": "user",
    "correlationId": "perm_1704110400003",
    "securityEvent": true,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Invalid State
```bash
POST /users/activate/suspended
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid user state for operation",
  "error": {
    "type": "invalid_state",
    "currentState": "suspended",
    "requiredState": "active",
    "operation": "activation",
    "possibleActions": ["Contact support for account review"]
  },
  "meta": {
    "errorCode": "USER_INVALID_STATE",
    "domain": "user",
    "retryable": false,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Validation Error (Required Field)
```bash
POST /users/validate-demo
Content-Type: application/json

{
  "username": "john"
}
```

**Response:**
```json
{
  "success": false,
  "message": "User validation failed",
  "error": {
    "type": "validation_error",
    "field": "email",
    "rule": "required",
    "value": null,
    "suggestions": ["Email is required"]
  },
  "meta": {
    "errorCode": "USER_VALIDATION_ERROR",
    "domain": "user",
    "validationType": "business",
    "correlationId": "val_1704110400004",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Error Types

### Structured Error Object
Error responses include a structured `error` object with:

- **`type`**: Error category (`validation_error`, `user_not_found`, `permission_denied`, `invalid_state`)
- **Type-specific fields**: Additional context based on error type
- **`details`**: Nested object with additional information when applicable

### Meta Information
All responses include relevant metadata:

- **`correlationId`**: Unique request identifier for tracing
- **`timestamp`**: ISO 8601 timestamp
- **`errorCode`**: Machine-readable error code
- **`domain`**: Business domain (e.g., "user", "product")
- **Security context**: Additional fields for security-related errors

## Testing Endpoints

```bash
# Success cases
curl http://localhost:3000/users/success-demo
curl http://localhost:3000/users/success-with-meta
curl http://localhost:3000/users/paginated?page=1&limit=5

# Error cases
curl http://localhost:3000/users/not-found/999
curl -X POST http://localhost:3000/users/validate-demo \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'

curl -X DELETE http://localhost:3000/users/admin-action/123 \
  -H "X-User-Role: user"

curl -X POST http://localhost:3000/users/activate/suspended

# Comprehensive demo
curl -X POST http://localhost:3000/users/comprehensive-demo \
  -H "Content-Type: application/json" \
  -d '{"action": "delete", "userId": "123", "userRole": "user"}'
```

## Benefits

### ✅ **Consistent Structure**
- Predictable response format across all endpoints
- Clear separation between success and error states
- Standardized metadata inclusion

### ✅ **Type Safety**
- `success` boolean eliminates response interpretation guesswork
- Structured error objects with type information
- Consistent meta field structure

### ✅ **Debugging & Monitoring**
- Correlation IDs for request tracing
- Timestamps for chronological analysis
- Error codes for automated monitoring

### ✅ **Client-Friendly**
- No need to check status codes AND response structure
- Error details include actionable suggestions
- Meta contains all contextual information

### ✅ **Extensible**
- Meta field can accommodate future requirements
- Error types can be extended without breaking changes
- Domain-specific context in structured format
