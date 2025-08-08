import { createMockRes } from '../test-core.helper.js';

/**
 * Tests for createMockRes helper to ensure branches related to res.json and res.send are covered.
 */
describe('createMockRes()', () => {
  test('tracks status and json calls correctly', () => {
    const res = createMockRes();
    const payload = { hello: 'world' };
    res.status(201).json(payload);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(payload);
    expect(res.body).toEqual(payload);
    expect(res.wasSent()).toBe(true);
  });

  test('tracks status and send calls correctly', () => {
    const res = createMockRes();
    const payload = { ok: true };
    res.status(202).send(payload);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalledWith(payload);
    expect(res.body).toEqual(payload);
    expect(res.wasSent()).toBe(true);
  });
});
