/**
 * @jest-environment node
 */
import { HTTP_STATUS } from '../../../core/constants/http-status.constant.js';
import { BaseException } from '../../../core/helpers/error-handler-registry.helper.js';
import {
  UserNotFoundException,
  UserPermissionException,
  UserStateException,
  UserValidationException,
} from '../exceptions/user.exceptions.js';

describe('User Exceptions', () => {
  describe('UserNotFoundException', () => {
    it('should create exception with correct properties', () => {
      const identifier = 'user123';
      const exception = new UserNotFoundException(identifier);

      expect(exception).toBeInstanceOf(BaseException);
      expect(exception.name).toBe('UserNotFoundException');
      expect(exception.message).toBe('User not found: user123');
      expect(exception.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(exception.errorCode).toBe('USER_NOT_FOUND');
      expect(exception.metadata.domain).toBe('user');
      expect(exception.metadata.identifier).toBe(identifier);
    });

    it('should accept custom options', () => {
      const identifier = 'user456';
      const correlationId = 'req_123';

      const exception = new UserNotFoundException(identifier, {
        correlationId,
        metadata: { source: 'api' },
      });

      expect(exception.correlationId).toBe(correlationId);
      expect(exception.metadata.domain).toBe('user');
      expect(exception.metadata.identifier).toBe(identifier);
      expect(exception.metadata.source).toBe('api');
    });
  });

  describe('UserValidationException', () => {
    it('should create validation exception with field details', () => {
      const field = 'email';
      const value = 'invalid-email';
      const rule = 'format';

      const exception = new UserValidationException(field, value, rule);

      expect(exception).toBeInstanceOf(BaseException);
      expect(exception.name).toBe('UserValidationException');
      expect(exception.message).toBe('User validation failed: email format');
      expect(exception.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(exception.errorCode).toBe('USER_VALIDATION_ERROR');
      expect(exception.data.field).toBe(field);
      expect(exception.data.value).toBe(value);
      expect(exception.data.rule).toBe(rule);
      expect(exception.metadata.domain).toBe('user');
      expect(exception.metadata.validationType).toBe('business');
    });

    it('should merge custom data and metadata', () => {
      const exception = new UserValidationException(
        'username',
        'ab',
        'length',
        {
          data: { minLength: 3 },
          metadata: { source: 'registration' },
        }
      );

      expect(exception.data.field).toBe('username');
      expect(exception.data.minLength).toBe(3);
      expect(exception.metadata.domain).toBe('user');
      expect(exception.metadata.source).toBe('registration');
    });
  });

  describe('UserPermissionException', () => {
    it('should create permission exception with security context', () => {
      const userId = 'user123';
      const action = 'delete';
      const resource = 'user:456';

      const exception = new UserPermissionException(userId, action, resource);

      expect(exception).toBeInstanceOf(BaseException);
      expect(exception.name).toBe('UserPermissionException');
      expect(exception.message).toBe(
        'User user123 lacks permission for delete on user:456'
      );
      expect(exception.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(exception.errorCode).toBe('USER_PERMISSION_DENIED');
      expect(exception.data.userId).toBe(userId);
      expect(exception.data.action).toBe(action);
      expect(exception.data.resource).toBe(resource);
      expect(exception.metadata.domain).toBe('user');
      expect(exception.metadata.securityContext).toBe(true);
    });

    it('should accept custom options for audit trail', () => {
      const exception = new UserPermissionException(
        'user1',
        'read',
        'sensitive-data',
        {
          correlationId: 'audit_789',
          metadata: { ipAddress: '192.168.1.1' },
        }
      );

      expect(exception.correlationId).toBe('audit_789');
      expect(exception.metadata.ipAddress).toBe('192.168.1.1');
      expect(exception.metadata.securityContext).toBe(true);
    });
  });

  describe('UserStateException', () => {
    it('should create state exception with transition details', () => {
      const userId = 'user123';
      const currentState = 'suspended';
      const requiredState = 'active';
      const operation = 'login';

      const exception = new UserStateException(
        userId,
        currentState,
        requiredState,
        operation
      );

      expect(exception).toBeInstanceOf(BaseException);
      expect(exception.name).toBe('UserStateException');
      expect(exception.message).toBe(
        'User user123 is suspended, requires active for login'
      );
      expect(exception.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(exception.errorCode).toBe('USER_INVALID_STATE');
      expect(exception.data.userId).toBe(userId);
      expect(exception.data.currentState).toBe(currentState);
      expect(exception.data.requiredState).toBe(requiredState);
      expect(exception.data.operation).toBe(operation);
      expect(exception.metadata.domain).toBe('user');
      expect(exception.metadata.stateTransition).toBe(true);
    });

    it('should merge custom data for state context', () => {
      const exception = new UserStateException(
        'user1',
        'pending',
        'verified',
        'purchase',
        {
          data: {
            submittedAt: '2024-01-01',
            reviewBy: 'admin',
          },
        }
      );

      expect(exception.data.userId).toBe('user1');
      expect(exception.data.submittedAt).toBe('2024-01-01');
      expect(exception.data.reviewBy).toBe('admin');
    });
  });

  describe('Inheritance', () => {
    it('should all extend BaseException', () => {
      const exceptions = [
        new UserNotFoundException('test'),
        new UserValidationException('field', 'value', 'rule'),
        new UserPermissionException('user', 'action', 'resource'),
        new UserStateException('user', 'current', 'required', 'operation'),
      ];

      exceptions.forEach(exception => {
        expect(exception).toBeInstanceOf(BaseException);
        expect(exception).toBeInstanceOf(Error);
        expect(exception.isOperational).toBe(true);
      });
    });

    it('should have proper stack traces', () => {
      const exception = new UserNotFoundException('test');
      expect(exception.stack).toBeDefined();
      expect(exception.stack).toContain('UserNotFoundException');
    });
  });
});
