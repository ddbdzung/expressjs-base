/**
 * @jest-environment node
 */
import { HTTP_STATUS } from '../../constants/http-status.constant.js';
import {
  BaseException,
  clearRegistry,
  findErrorHandler,
  getRegisteredHandlers,
  handleWithRegistry,
  registerErrorHandler,
} from '../error-handler-registry.helper.js';
import { HttpResponse } from '../http.helper.js';

// Test exception classes
class TestException extends BaseException {
  constructor(message, options = {}) {
    super(message, { statusCode: HTTP_STATUS.BAD_REQUEST, ...options });
    this.name = 'TestException';
  }
}

class SpecificTestException extends TestException {
  constructor(message, options = {}) {
    super(message, { statusCode: HTTP_STATUS.CONFLICT, ...options });
    this.name = 'SpecificTestException';
  }
}

// Test handlers
function testHandler(err, req, res) {
  return HttpResponse.error('Test handler response', HTTP_STATUS.BAD_REQUEST);
}

function specificHandler(err, req, res) {
  return HttpResponse.error('Specific handler response', HTTP_STATUS.CONFLICT);
}

describe('ErrorHandlerRegistry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  afterEach(() => {
    clearRegistry();
  });

  describe('registerErrorHandler', () => {
    it('should register handler for exception class', () => {
      registerErrorHandler(TestException, testHandler);

      const handlers = getRegisteredHandlers();
      expect(handlers.get(TestException)).toBe(testHandler);
    });

    it('should throw error for invalid exception class', () => {
      expect(() => {
        registerErrorHandler('NotAClass', testHandler);
      }).toThrow('ExceptionClass must be a constructor function');
    });

    it('should throw error for invalid handler', () => {
      expect(() => {
        registerErrorHandler(TestException, 'NotAFunction');
      }).toThrow('Handler must be a function');
    });

    it('should allow multiple handlers for different classes', () => {
      registerErrorHandler(TestException, testHandler);
      registerErrorHandler(SpecificTestException, specificHandler);

      const handlers = getRegisteredHandlers();
      expect(handlers.size).toBe(2);
      expect(handlers.get(TestException)).toBe(testHandler);
      expect(handlers.get(SpecificTestException)).toBe(specificHandler);
    });
  });

  describe('findErrorHandler', () => {
    beforeEach(() => {
      registerErrorHandler(TestException, testHandler);
      registerErrorHandler(SpecificTestException, specificHandler);
    });

    it('should find exact match handler', () => {
      const err = new TestException('test');
      const handler = findErrorHandler(err);
      expect(handler).toBe(testHandler);
    });

    it('should find most specific handler in inheritance chain', () => {
      const err = new SpecificTestException('specific test');
      const handler = findErrorHandler(err);
      expect(handler).toBe(specificHandler);
    });

    it('should find parent handler when no specific handler exists', () => {
      clearRegistry();
      registerErrorHandler(TestException, testHandler);

      const err = new SpecificTestException('specific test');
      const handler = findErrorHandler(err);
      expect(handler).toBe(testHandler);
    });

    it('should return null when no handler found', () => {
      const err = new Error('unknown error');
      const handler = findErrorHandler(err);
      expect(handler).toBeNull();
    });
  });

  describe('handleWithRegistry', () => {
    const mockReq = { path: '/test' };
    const mockRes = {};

    beforeEach(() => {
      registerErrorHandler(TestException, testHandler);
    });

    it('should handle error with registered handler', () => {
      const err = new TestException('test error');
      const response = handleWithRegistry(err, mockReq, mockRes);

      expect(response).toBeInstanceOf(HttpResponse);
      expect(response.message).toBe('Test handler response');
      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should return null when no handler found', () => {
      const err = new Error('unknown error');
      const response = handleWithRegistry(err, mockReq, mockRes);

      expect(response).toBeNull();
    });

    it('should pass correct arguments to handler', () => {
      const mockHandler = jest.fn(() => HttpResponse.success({}));
      registerErrorHandler(TestException, mockHandler);

      const err = new TestException('test');
      handleWithRegistry(err, mockReq, mockRes);

      expect(mockHandler).toHaveBeenCalledWith(err, mockReq, mockRes);
    });
  });

  describe('getRegisteredHandlers', () => {
    it('should return copy of registry', () => {
      registerErrorHandler(TestException, testHandler);

      const handlers = getRegisteredHandlers();
      expect(handlers).toBeInstanceOf(Map);
      expect(handlers.get(TestException)).toBe(testHandler);

      // Should be a copy, not the original
      handlers.clear();
      const handlersAfterClear = getRegisteredHandlers();
      expect(handlersAfterClear.size).toBe(1);
    });

    it('should return empty map when no handlers registered', () => {
      const handlers = getRegisteredHandlers();
      expect(handlers.size).toBe(0);
    });
  });

  describe('clearRegistry', () => {
    it('should clear all registered handlers', () => {
      registerErrorHandler(TestException, testHandler);
      registerErrorHandler(SpecificTestException, specificHandler);

      expect(getRegisteredHandlers().size).toBe(2);

      clearRegistry();

      expect(getRegisteredHandlers().size).toBe(0);
    });
  });

  describe('inheritance handling', () => {
    it('should prioritize exact match over inheritance', () => {
      // Register handler for parent class
      registerErrorHandler(TestException, testHandler);
      // Register handler for child class
      registerErrorHandler(SpecificTestException, specificHandler);

      // Child instance should get child handler
      const childErr = new SpecificTestException('child');
      const childHandler = findErrorHandler(childErr);
      expect(childHandler).toBe(specificHandler);

      // Parent instance should get parent handler
      const parentErr = new TestException('parent');
      const parentHandler = findErrorHandler(parentErr);
      expect(parentHandler).toBe(testHandler);
    });

    it('should fall back to parent handler when child handler not found', () => {
      // Only register parent handler
      registerErrorHandler(TestException, testHandler);

      // Child instance should get parent handler
      const childErr = new SpecificTestException('child');
      const handler = findErrorHandler(childErr);
      expect(handler).toBe(testHandler);
    });
  });
});
