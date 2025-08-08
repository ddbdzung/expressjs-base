import { overrideHttpOptions } from '../../config/http-options.config.js';
import { HTTP_STATUS } from '../../constants/http-status.constant.js';
import { HttpResponse } from '../http.helper.js';
import { createMockRes, resetHttpOptions } from '../test-core.helper.js';

describe('HttpResponse – send() normalized format', () => {
  afterEach(() => {
    jest.clearAllMocks();
    resetHttpOptions();
  });

  test('should send success response with normalized format', () => {
    overrideHttpOptions({ USE_STATUS_CODE_IN_RESPONSE: false });
    const res = createMockRes();
    const resp = HttpResponse.success({ id: 1 }, 'User found');
    resp.send(res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(res.body).toEqual({
      success: true,
      message: 'User found',
      data: { id: 1 },
      meta: { timestamp: expect.any(String) },
    });
    expect(res.type).toHaveBeenCalledWith('application/json');
    expect(res.wasSent()).toBe(true);
  });

  test('should send error response with normalized format', () => {
    overrideHttpOptions({ USE_STATUS_CODE_IN_RESPONSE: false });
    const res = createMockRes();
    const errorDetails = { type: 'validation', field: 'email' };
    const resp = HttpResponse.error(
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      errorDetails
    );
    resp.send(res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.body).toEqual({
      success: false,
      message: 'Validation failed',
      error: errorDetails,
      meta: { timestamp: expect.any(String) },
    });
  });

  test('should respect SET_DEFAULT_HTTP_STATUS_CODE option', () => {
    overrideHttpOptions({
      SET_DEFAULT_HTTP_STATUS_CODE: true,
      DEFAULT_HTTP_STATUS_CODE: 418,
      USE_STATUS_CODE_IN_RESPONSE: false,
    });
    const res = createMockRes();
    const resp = HttpResponse.success({ data: 'okay' }, 'fine');
    resp.send(res);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.body).toEqual({
      success: true,
      message: 'fine',
      data: { data: 'okay' },
      meta: { timestamp: expect.any(String) },
    });
  });

  test('should include statusCode in response when USE_STATUS_CODE_IN_RESPONSE = true', () => {
    overrideHttpOptions({ USE_STATUS_CODE_IN_RESPONSE: true });
    const res = createMockRes();
    const resp = HttpResponse.success({ test: 'data' });
    resp.send(res);

    expect(res.body).toEqual({
      success: true,
      message: resp.message,
      statusCode: HTTP_STATUS.OK,
      data: { test: 'data' },
      meta: { timestamp: expect.any(String) },
    });
  });

  test('should exclude null/undefined data from response', () => {
    overrideHttpOptions({ USE_STATUS_CODE_IN_RESPONSE: false });
    const res = createMockRes();
    const resp = HttpResponse.success(null, 'No content');
    resp.send(res);

    expect(res.body).toEqual({
      success: true,
      message: 'No content',
      meta: { timestamp: expect.any(String) },
    });
    expect(res.body.data).toBeUndefined();
  });

  test('should exclude null/undefined error from response', () => {
    overrideHttpOptions({ USE_STATUS_CODE_IN_RESPONSE: false });
    const res = createMockRes();
    const resp = HttpResponse.error(
      'Internal error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      null
    );
    resp.send(res);

    expect(res.body).toEqual({
      success: false,
      message: 'Internal error',
      meta: { timestamp: expect.any(String) },
    });
    expect(res.body.error).toBeUndefined();
  });

  test('should throw for invalid Express response object', () => {
    const resp = HttpResponse.success('x');
    expect(() => resp.send({})).toThrow('Invalid Express response object');
  });
});
