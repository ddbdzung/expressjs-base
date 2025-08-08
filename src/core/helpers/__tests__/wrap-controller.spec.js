import { overrideHttpOptions } from '../../config/http-options.config.js';
import { HTTP_STATUS } from '../../constants/http-status.constant.js';
import { BaseException } from '../error-handler-registry.helper.js';
import { HttpResponse, wrapController } from '../http.helper.js';
import {
  createMockNext,
  createMockRes,
  resetHttpOptions,
} from '../test-core.helper.js';

/**
 * Dummy controller helpers
 */
const simpleObjectController = () => ({ msg: 'ok' });
const httpResponseController = () => HttpResponse.success('yay');
const throwHttpResponseController = () => {
  throw HttpResponse.error('bad', HTTP_STATUS.BAD_REQUEST);
};
const throwBaseExceptionController = () => {
  throw new BaseException('unauth', HTTP_STATUS.UNAUTHORIZED);
};
const asyncErrorController = async () => {
  throw new Error('unexpected');
};

async function callWrapped(controller, wrapOpts = {}) {
  const handler = wrapController(controller, wrapOpts);
  const req = {};
  const res = createMockRes();
  const next = createMockNext();
  await handler(req, res, next);
  return { res, next };
}

describe('wrapController()', () => {
  afterEach(() => {
    jest.clearAllMocks();
    resetHttpOptions();
  });

  test('plain object return should wrap into success 200', async () => {
    const { res } = await callWrapped(simpleObjectController);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(res.body.data).toEqual({ msg: 'ok' });
  });

  test('HttpResponse instance return is sent as is', async () => {
    const { res } = await callWrapped(httpResponseController);
    expect(res.body.data).toBe('yay');
  });

  test('throwing HttpResponse is forwarded to next()', async () => {
    const { res, next } = await callWrapped(throwHttpResponseController);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpResponse);
  });

  test('throwing BaseException is forwarded to next()', async () => {
    const { res, next } = await callWrapped(throwBaseExceptionController);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(BaseException);
  });

  test('unexpected error is forwarded to next()', async () => {
    const { next } = await callWrapped(asyncErrorController);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  test('undefined return -> success(null) when STRICT_CONTROLLER_RETURN = false', async () => {
    overrideHttpOptions({ STRICT_CONTROLLER_RETURN: false });
    const controller = () => undefined;
    const { res } = await callWrapped(controller);
    expect(res.body.data).toBeUndefined(); // Updated: null data is excluded from response
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
  });

  test('direct res.send inside controller is blocked by proxy', async () => {
    const controller = (req, res) => {
      res.send('should not reach');
    };
    const { next } = await callWrapped(controller);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toMatch(/Direct use of res\.send/);
  });

  test('STRICT_CONTROLLER_RETURN true -> throws BaseException forwarded to next()', async () => {
    overrideHttpOptions({ STRICT_CONTROLLER_RETURN: true });
    const controller = () => undefined; // no return
    const { res, next } = await callWrapped(controller);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(BaseException);
  });

  test('allowed property access on res proxy should work', async () => {
    const controller = (req, res) => res.headersSent; // allowed prop
    const { res } = await callWrapped(controller);
    expect(res.body.data).toBe(false);
  });

  test('allowRes option permits direct res.send', async () => {
    const controller = (req, res) => {
      res.status(201).type('text/plain').send('free');
    };
    const { res } = await callWrapped(controller, { allowRes: true });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith('free');
    expect(res.body).toBe('free');
  });
});
