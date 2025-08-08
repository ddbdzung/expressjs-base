import { HTTP_STATUS } from '../../constants/http-status.constant.js';
import { HttpResponse, wrapController } from '../http.helper.js';
import { createMockNext, createMockRes } from '../test-core.helper.js';

describe('wrapController – additional branch coverage', () => {
  test('accessing unknown property on res proxy returns undefined and does not crash', async () => {
    const controller = (req, res) => {
      const val = res.someUnknownProp; // triggers proxy branch where prop not found
      return { val };
    };
    const handler = wrapController(controller); // allowRes = false by default
    const req = {};
    const res = createMockRes();
    const next = createMockNext();

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(res.body.data).toEqual({ val: undefined });
  });
});
