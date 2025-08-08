const { deepFreeze, defineConst } = require('../define-const.util');
// import { deepFreeze, defineConst } from './define-const.util';

describe('deepFreeze', () => {
  test('should freeze primitive values', () => {
    expect(deepFreeze(42)).toBe(42);
    expect(deepFreeze('hello')).toBe('hello');
    expect(deepFreeze(true)).toBe(true);
    expect(deepFreeze(null)).toBe(null);
    expect(deepFreeze(undefined)).toBe(undefined);
  });

  test('should freeze simple objects', () => {
    const obj = { a: 1, b: 2 };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(() => {
      frozen.a = 10;
    }).toThrow();
    expect(() => {
      frozen.c = 3;
    }).toThrow();
  });

  test('should freeze nested objects', () => {
    const obj = {
      level1: {
        level2: {
          value: 42,
        },
      },
    };

    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.level1)).toBe(true);
    expect(Object.isFrozen(frozen.level1.level2)).toBe(true);

    expect(() => {
      frozen.level1.level2.value = 100;
    }).toThrow();
    expect(() => {
      frozen.level1.newProp = 'test';
    }).toThrow();
  });

  test('should freeze arrays', () => {
    const arr = [1, 2, { nested: 'value' }];
    const frozen = deepFreeze(arr);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen[2])).toBe(true);

    expect(() => {
      frozen[0] = 10;
    }).toThrow();
    expect(() => {
      frozen.push(4);
    }).toThrow();
    expect(() => {
      frozen[2].nested = 'changed';
    }).toThrow();
  });

  test('should handle circular references', () => {
    const obj = { name: 'parent' };
    obj.self = obj;

    // Should not throw stack overflow
    expect(() => deepFreeze(obj)).not.toThrow();

    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(() => {
      frozen.name = 'changed';
    }).toThrow();
  });

  test('should handle Date objects', () => {
    const date = new Date();
    const obj = { timestamp: date };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.timestamp)).toBe(true);
    expect(() => {
      frozen.timestamp = new Date();
    }).toThrow();
  });

  test('should handle RegExp objects', () => {
    const regex = /test/g;
    const obj = { pattern: regex };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.pattern)).toBe(true);
    expect(() => {
      frozen.pattern = /new/;
    }).toThrow();
  });

  test('should handle empty objects and arrays', () => {
    const emptyObj = {};
    const emptyArr = [];

    const frozenObj = deepFreeze(emptyObj);
    const frozenArr = deepFreeze(emptyArr);

    expect(Object.isFrozen(frozenObj)).toBe(true);
    expect(Object.isFrozen(frozenArr)).toBe(true);

    expect(() => {
      frozenObj.newProp = 'test';
    }).toThrow();
    expect(() => {
      frozenArr.push(1);
    }).toThrow();
  });

  test('should handle mixed nested structures', () => {
    const complex = {
      string: 'test',
      number: 42,
      boolean: true,
      array: [1, 2, { nested: 'array-object' }],
      object: {
        inner: {
          deep: ['a', 'b', { deepest: 'value' }],
        },
      },
      nullValue: null,
      undefinedValue: undefined,
    };

    const frozen = deepFreeze(complex);

    // Check all levels are frozen
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.array)).toBe(true);
    expect(Object.isFrozen(frozen.array[2])).toBe(true);
    expect(Object.isFrozen(frozen.object)).toBe(true);
    expect(Object.isFrozen(frozen.object.inner)).toBe(true);
    expect(Object.isFrozen(frozen.object.inner.deep)).toBe(true);
    expect(Object.isFrozen(frozen.object.inner.deep[2])).toBe(true);

    // Test mutations throw
    expect(() => {
      frozen.string = 'changed';
    }).toThrow();
    expect(() => {
      frozen.array[0] = 10;
    }).toThrow();
    expect(() => {
      frozen.array[2].nested = 'changed';
    }).toThrow();
    expect(() => {
      frozen.object.inner.deep[2].deepest = 'changed';
    }).toThrow();
  });

  test('should return the same object reference', () => {
    const obj = { a: 1 };
    const frozen = deepFreeze(obj);
    expect(frozen).toBe(obj);
  });
});

describe('defineConst', () => {
  test('should create frozen constants object', () => {
    const STATUS = defineConst({
      PENDING: 'pending',
      PROCESSING: 'processing',
      EMITTED: 'emitted',
    });

    expect(Object.isFrozen(STATUS)).toBe(true);
    expect(STATUS.PENDING).toBe('pending');
    expect(STATUS.PROCESSING).toBe('processing');
    expect(STATUS.EMITTED).toBe('emitted');

    expect(() => {
      STATUS.PENDING = 'changed';
    }).toThrow();
    expect(() => {
      STATUS.NEW_STATUS = 'new';
    }).toThrow();
  });

  test('should work with nested constant structures', () => {
    const CONFIG = defineConst({
      API: {
        ENDPOINTS: {
          USERS: '/api/users',
          POSTS: '/api/posts',
        },
        TIMEOUT: 5000,
      },
      MESSAGES: {
        ERROR: 'Something went wrong',
        SUCCESS: 'Operation completed',
      },
    });

    expect(Object.isFrozen(CONFIG)).toBe(true);
    expect(Object.isFrozen(CONFIG.API)).toBe(true);
    expect(Object.isFrozen(CONFIG.API.ENDPOINTS)).toBe(true);
    expect(Object.isFrozen(CONFIG.MESSAGES)).toBe(true);

    expect(() => {
      CONFIG.API.TIMEOUT = 10000;
    }).toThrow();
    expect(() => {
      CONFIG.API.ENDPOINTS.USERS = '/new-endpoint';
    }).toThrow();
    expect(() => {
      CONFIG.MESSAGES.WARNING = 'New warning';
    }).toThrow();
  });

  test('should handle arrays in constants', () => {
    const VALID_STATUSES = defineConst({
      ACTIVE: ['running', 'processing', 'waiting'],
      INACTIVE: ['stopped', 'paused', 'error'],
    });

    expect(Object.isFrozen(VALID_STATUSES)).toBe(true);
    expect(Object.isFrozen(VALID_STATUSES.ACTIVE)).toBe(true);
    expect(Object.isFrozen(VALID_STATUSES.INACTIVE)).toBe(true);

    expect(() => {
      VALID_STATUSES.ACTIVE[0] = 'changed';
    }).toThrow();
    expect(() => {
      VALID_STATUSES.ACTIVE.push('new-status');
    }).toThrow();
  });
});

describe('edge cases', () => {
  test('should handle functions in objects', () => {
    const obj = {
      method: function () {
        return 'test';
      },
      arrow: () => 'arrow',
    };

    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(frozen.method()).toBe('test');
    expect(frozen.arrow()).toBe('arrow');
    expect(() => {
      frozen.method = () => 'changed';
    }).toThrow();
  });

  test('should handle symbols as keys', () => {
    const sym = Symbol('test');
    const obj = {
      [sym]: 'symbol-value',
      regular: 'regular-value',
    };

    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    // eslint-disable-next-line security/detect-object-injection
    expect(frozen[sym]).toBe('symbol-value');

    expect(() => {
      frozen[sym] = 'changed';
    }).toThrow();
  });

  test('should preserve prototype chain', () => {
    class TestClass {
      constructor(value) {
        this.value = value;
      }

      getValue() {
        return this.value;
      }
    }

    const instance = new TestClass(42);
    const frozen = deepFreeze(instance);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(frozen instanceof TestClass).toBe(true);
    expect(frozen.getValue()).toBe(42);
    expect(() => {
      frozen.value = 100;
    }).toThrow();
  });
});
