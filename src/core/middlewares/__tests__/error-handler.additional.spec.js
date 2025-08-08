import { HTTP_STATUS } from '../../constants/http-status.constant.js';
import { BaseException } from '../../helpers/error-handler-registry.helper.js';
import {
  createMockNext,
  createMockReq,
  createMockRes,
} from '../../helpers/test-core.helper.js';
import globalErrorHandler from '../error-handler.middleware.js';

function callErrorHandler(err) {
  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();
  globalErrorHandler(err, req, res, next);
  return { res, next };
}

describe('globalErrorHandler – additional branches', () => {
  test('BaseException without status uses INTERNAL_SERVER_ERROR default', () => {
    const err = new BaseException('oops'); // No status provided, should use default
    const { res } = callErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  test('non-production environment returns original error message', () => {
    const { res } = callErrorHandler(new Error('boom'));
    expect(res.body.message).toBe('boom');
  });
});
