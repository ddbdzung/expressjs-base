import { HTTP_STATUS } from '../../constants/http-status.constant.js';
import { HttpResponse } from '../http.helper.js';

describe('HttpResponse – factory methods', () => {
  describe('Success factories', () => {
    test('success()', () => {
      const resp = HttpResponse.success({ a: 1 }, 'Operation completed');
      expect(resp).toBeInstanceOf(HttpResponse);
      expect(resp.success).toBe(true);
      expect(resp.statusCode).toBe(HTTP_STATUS.OK);
      expect(resp.message).toBe('Operation completed');
      expect(resp.data).toEqual({ a: 1 });
      expect(resp.meta.timestamp).toBeDefined();
    });

    test('created()', () => {
      const resp = HttpResponse.created({ id: 1 }, 'User created');
      expect(resp.success).toBe(true);
      expect(resp.statusCode).toBe(HTTP_STATUS.CREATED);
      expect(resp.message).toBe('User created');
      expect(resp.data).toEqual({ id: 1 });
    });

    test('noContent()', () => {
      const resp = HttpResponse.noContent('Deleted successfully');
      expect(resp.success).toBe(true);
      expect(resp.statusCode).toBe(HTTP_STATUS.NO_CONTENT);
      expect(resp.message).toBe('Deleted successfully');
      expect(resp.data).toBeNull();
    });

    test('paginated()', () => {
      const data = Array.from({ length: 5 }).map((_, i) => `item${i}`);
      const resp = HttpResponse.paginated(data, {
        page: 2,
        limit: 5,
        total: 13,
      });
      expect(resp.success).toBe(true);
      expect(resp.statusCode).toBe(HTTP_STATUS.OK);
      expect(resp.data).toEqual(data);
      expect(resp.meta.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 13,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });
  });

  describe('Error factories', () => {
    test('error()', () => {
      const errorDetails = { type: 'validation', field: 'email' };
      const resp = HttpResponse.error(
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        errorDetails
      );
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(resp.message).toBe('Validation failed');
      expect(resp.data).toEqual(errorDetails);
    });

    test('badRequest()', () => {
      const resp = HttpResponse.badRequest('Invalid input', { field: 'name' });
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(resp.message).toBe('Invalid input');
      expect(resp.data).toEqual({ field: 'name' });
    });

    test('unauthorized()', () => {
      const resp = HttpResponse.unauthorized('Token expired');
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(resp.message).toBe('Token expired');
    });

    test('forbidden()', () => {
      const resp = HttpResponse.forbidden('Access denied');
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    test('notFound()', () => {
      const resp = HttpResponse.notFound('User not found');
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    test('conflict()', () => {
      const resp = HttpResponse.conflict('Email already exists');
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.CONFLICT);
    });

    test('validationError()', () => {
      const errors = [{ field: 'email', message: 'Invalid format' }];
      const resp = HttpResponse.validationError('Validation failed', errors);
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(resp.data.type).toBe('validation');
      expect(resp.data.errors).toEqual(errors);
      expect(resp.meta.errorType).toBe('validation');
    });

    test('businessError()', () => {
      const resp = HttpResponse.businessError(
        'Insufficient funds',
        'INSUFFICIENT_FUNDS',
        { balance: 100 }
      );
      expect(resp.success).toBe(false);
      expect(resp.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(resp.data.type).toBe('business');
      expect(resp.data.code).toBe('INSUFFICIENT_FUNDS');
      expect(resp.data.details).toEqual({ balance: 100 });
      expect(resp.meta.errorCode).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('Utility methods', () => {
    test('withCorrelationId()', () => {
      const resp = HttpResponse.success({ data: 'test' }).withCorrelationId(
        'req-123'
      );
      expect(resp.meta.correlationId).toBe('req-123');
    });

    test('withSource()', () => {
      const resp = HttpResponse.success({ data: 'test' }).withSource(
        'user-service'
      );
      expect(resp.meta.source).toBe('user-service');
    });

    test('withMeta()', () => {
      const resp = HttpResponse.success({ data: 'test' }).withMeta({
        custom: 'value',
      });
      expect(resp.meta.custom).toBe('value');
      expect(resp.meta.timestamp).toBeDefined(); // Should preserve existing meta
    });
  });
});
