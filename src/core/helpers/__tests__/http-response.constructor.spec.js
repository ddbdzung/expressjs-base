import {
  HTTP_STATUS,
  getStatusText,
} from '../../constants/http-status.constant.js';
import { HttpResponse } from '../http.helper.js';

describe('HttpResponse – constructor & utilities', () => {
  test('should initialise fields correctly with defaults', () => {
    const resp = new HttpResponse('payload', undefined, HTTP_STATUS.CREATED, {
      meta: true,
    });

    expect(resp.data).toBe('payload');
    expect(resp.message).toBe(getStatusText(HTTP_STATUS.CREATED));
    expect(resp.statusCode).toBe(HTTP_STATUS.CREATED);
    expect(resp.success).toBe(true);
    expect(resp.meta.meta).toBe(true);
    expect(resp.meta.timestamp).toBeDefined();
  });

  test.each([
    [HTTP_STATUS.OK, true],
    [HTTP_STATUS.NO_CONTENT, true],
    [HTTP_STATUS.CREATED, true],
    [HTTP_STATUS.BAD_REQUEST, false],
    [HTTP_STATUS.INTERNAL_SERVER_ERROR, false],
  ])('success flag for statusCode %p is %p', (code, expected) => {
    expect(new HttpResponse(null, null, code).success).toBe(expected);
  });

  test('toObject() output should have correct structure', () => {
    const resp = new HttpResponse({ foo: 'bar' }, 'all good');
    const obj = resp.toObject();

    expect(obj).toEqual({
      success: true,
      message: 'all good',
      statusCode: 200,
      data: { foo: 'bar' },
      meta: { timestamp: expect.any(String) },
    });
  });

  test('toJSON() should stringify toObject()', () => {
    const resp = new HttpResponse({ foo: 'bar' }, 'yep');
    expect(JSON.parse(resp.toJSON())).toEqual(resp.toObject());
  });
});
