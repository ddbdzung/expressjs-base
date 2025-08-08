import { HTTP_STATUS } from '../../constants/http-status.constant.js';
import { BaseException } from '../../helpers/error-handler-registry.helper.js';
import { HttpResponse } from '../../helpers/http.helper.js';
import {
  createMockNext,
  createMockReq,
  createMockRes,
} from '../../helpers/test-core.helper.js';
import globalErrorHandler from '../error-handler.middleware.js';

/**
 * Helper to invoke the error handler and return mocks
 */
function callErrorHandler(err) {
  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();
  globalErrorHandler(err, req, res, next);
  return { res, next };
}

describe('globalErrorHandler()', () => {
  test('handles HttpResponse instance directly', () => {
    const err = HttpResponse.error('bad', HTTP_STATUS.BAD_REQUEST);
    const { res } = callErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.message).toBe('bad');
  });

  test('converts BaseException to HttpResponse.error', () => {
    const err = new BaseException('unauth', {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
    const { res } = callErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
  });

  test('handles unexpected error as 500', () => {
    const err = new Error('something blew up');
    const { res } = callErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.body.success).toBe(false);
  });

  test('delegates to next() when headers already sent', () => {
    const err = new Error('after send');
    const req = createMockReq();
    const res = createMockRes();
    res.headersSent = true;
    const next = createMockNext();
    globalErrorHandler(err, req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('mask message in production env', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { res } = callErrorHandler(new Error('boom'));
    expect(res.body.message).toBe('Internal Server Error');
    process.env.NODE_ENV = originalEnv;
  });
});
