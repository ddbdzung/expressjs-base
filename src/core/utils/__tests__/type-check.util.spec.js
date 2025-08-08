/**
 * Unit tests for Type Checking Utilities
 * Test file using Jest framework
 */
import {
  getType,
  isArguments,
  isArray,
  isArrayLike,
  isBigInt,
  isBoolean,
  isBuffer,
  isDate,
  isEmail,
  isEmpty,
  isError,
  isFiniteNumber,
  isFunction,
  isInteger,
  isIterable,
  isJSON,
  isMap,
  isNanValue,
  isNull,
  isNullish,
  isNumber,
  isObject,
  isPlainArray,
  isPlainObject,
  isPrimitive,
  isPromise,
  isRegExp,
  isSafeInteger,
  isSet,
  isString,
  isSymbol,
  isTypedArray,
  isURL,
  isUndefined,
  isWeakMap,
  isWeakSet,
} from '../type-check.util';

describe('Type Checking Utilities', () => {
  describe('getType', () => {
    test('should return correct type names', () => {
      expect(getType('hello')).toBe('string');
      expect(getType(42)).toBe('number');
      expect(getType(true)).toBe('boolean');
      expect(getType(null)).toBe('null');
      expect(getType(undefined)).toBe('undefined');
      expect(getType([])).toBe('array');
      expect(getType({})).toBe('object');
      expect(getType(new Date())).toBe('date');
      expect(getType(/regex/)).toBe('regexp');
      expect(getType(() => {})).toBe('function');
    });
  });

  describe('isString', () => {
    test('should return true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString('123')).toBe(true);
      expect(isString(String('test'))).toBe(true);
    });

    test('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString(new String('test'))).toBe(false);
    });
  });

  describe('isNumber', () => {
    test('should return true for valid numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);
    });

    test('should return false for non-numbers and NaN', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isNumber({})).toBe(false);
    });
  });

  describe('isBoolean', () => {
    test('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(Boolean(1))).toBe(true);
      expect(isBoolean(Boolean(0))).toBe(true);
    });

    test('should return false for non-booleans', () => {
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean('false')).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean(new Boolean(true))).toBe(false);
    });
  });

  describe('isUndefined', () => {
    test('should return true for undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(void 0)).toBe(true);
      let x;
      expect(isUndefined(x)).toBe(true);
    });

    test('should return false for non-undefined values', () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined('')).toBe(false);
      expect(isUndefined(false)).toBe(false);
    });
  });

  describe('isNull', () => {
    test('should return true for null', () => {
      expect(isNull(null)).toBe(true);
    });

    test('should return false for non-null values', () => {
      expect(isNull(undefined)).toBe(false);
      expect(isNull(0)).toBe(false);
      expect(isNull('')).toBe(false);
      expect(isNull(false)).toBe(false);
    });
  });

  describe('isNullish', () => {
    test('should return true for null or undefined', () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
    });

    test('should return false for other values', () => {
      expect(isNullish(0)).toBe(false);
      expect(isNullish('')).toBe(false);
      expect(isNullish(false)).toBe(false);
      expect(isNullish([])).toBe(false);
    });
  });

  describe('isFunction', () => {
    test('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function () {})).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
      expect(isFunction(function* () {})).toBe(true);
      expect(isFunction(Math.max)).toBe(true);
      expect(isFunction(Array)).toBe(true);
    });

    test('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction([])).toBe(false);
      expect(isFunction('function')).toBe(false);
      expect(isFunction(null)).toBe(false);
    });
  });

  describe('isObject', () => {
    test('should return true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(new Date())).toBe(true);
      expect(isObject(/regex/)).toBe(true);
      expect(isObject(new Error())).toBe(true);
    });

    test('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(() => {})).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    test('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
      expect(isPlainObject(Object.create(Object.prototype))).toBe(true);
    });

    test('should return false for non-plain objects', () => {
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(/regex/)).toBe(false);
      expect(isPlainObject(new Error())).toBe(false);
      expect(isPlainObject(null)).toBe(false);
    });
  });

  describe('isArray', () => {
    test('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(new Array())).toBe(true);
      expect(isArray(Array.from('hello'))).toBe(true);
    });

    test('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
      expect(isArray({ length: 0 })).toBe(false);
      // eslint-disable-next-line no-undef
      expect(isArray(arguments)).toBe(false);
    });
  });

  describe('isPlainArray', () => {
    test('should return true for plain arrays', () => {
      expect(isPlainArray([])).toBe(true);
      expect(isPlainArray([1, 2, 3])).toBe(true);
      expect(isPlainArray(new Array())).toBe(true);
    });

    test('should return false for non-plain arrays', () => {
      class CustomArray extends Array {}
      expect(isPlainArray(new CustomArray())).toBe(false);
      expect(isPlainArray({})).toBe(false);
      expect(isPlainArray('array')).toBe(false);
    });
  });

  describe('isDate', () => {
    test('should return true for valid Date objects', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2023-01-01'))).toBe(true);
      expect(isDate(new Date(0))).toBe(true);
    });

    test('should return false for invalid dates and non-dates', () => {
      expect(isDate(new Date('invalid'))).toBe(false);
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate(1234567890)).toBe(false);
      expect(isDate({})).toBe(false);
    });
  });

  describe('isRegExp', () => {
    test('should return true for RegExp objects', () => {
      expect(isRegExp(/test/)).toBe(true);
      expect(isRegExp(new RegExp('test'))).toBe(true);
      expect(isRegExp(/test/gi)).toBe(true);
    });

    test('should return false for non-RegExp values', () => {
      expect(isRegExp('/test/')).toBe(false);
      expect(isRegExp({})).toBe(false);
      expect(isRegExp(null)).toBe(false);
    });
  });

  describe('isError', () => {
    test('should return true for Error objects', () => {
      expect(isError(new Error())).toBe(true);
      expect(isError(new TypeError())).toBe(true);
      expect(isError(new ReferenceError())).toBe(true);
      expect(isError(new SyntaxError())).toBe(true);
    });

    test('should return false for non-Error objects', () => {
      expect(isError('Error')).toBe(false);
      expect(isError({ name: 'Error', message: 'test' })).toBe(false);
      expect(isError({})).toBe(false);
    });
  });

  describe('isPromise', () => {
    test('should return true for Promise objects', () => {
      expect(isPromise(Promise.resolve())).toBe(true);
      expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
      expect(isPromise({ then: () => {} })).toBe(true);
    });

    test('should return false for non-Promise objects', () => {
      expect(isPromise({})).toBe(false);
      expect(isPromise({ then: 'not a function' })).toBe(false);
      expect(isPromise(null)).toBe(false);
    });
  });

  describe('isSymbol', () => {
    test('should return true for Symbol values', () => {
      expect(isSymbol(Symbol())).toBe(true);
      expect(isSymbol(Symbol('test'))).toBe(true);
      expect(isSymbol(Symbol.iterator)).toBe(true);
    });

    test('should return false for non-Symbol values', () => {
      expect(isSymbol('Symbol()')).toBe(false);
      expect(isSymbol({})).toBe(false);
      expect(isSymbol(null)).toBe(false);
    });
  });

  describe('isBigInt', () => {
    test('should return true for BigInt values', () => {
      expect(isBigInt(BigInt(123))).toBe(true);
      expect(isBigInt(123n)).toBe(true);
      expect(isBigInt(BigInt('123456789012345678901234567890'))).toBe(true);
    });

    test('should return false for non-BigInt values', () => {
      expect(isBigInt(123)).toBe(false);
      expect(isBigInt('123n')).toBe(false);
      expect(isBigInt({})).toBe(false);
    });
  });

  describe('isNanValue', () => {
    test('should return true for NaN', () => {
      expect(isNanValue(NaN)).toBe(true);
      expect(isNanValue(Number.NaN)).toBe(true);
      expect(isNanValue(0 / 0)).toBe(true);
    });

    test('should return false for non-NaN values', () => {
      expect(isNanValue(123)).toBe(false);
      expect(isNanValue('NaN')).toBe(false);
      expect(isNanValue(undefined)).toBe(false);
      expect(isNanValue(null)).toBe(false);
    });
  });

  describe('isFiniteNumber', () => {
    test('should return true for finite numbers', () => {
      expect(isFiniteNumber(123)).toBe(true);
      expect(isFiniteNumber(-123)).toBe(true);
      expect(isFiniteNumber(0)).toBe(true);
      expect(isFiniteNumber(3.14)).toBe(true);
    });

    test('should return false for non-finite values', () => {
      expect(isFiniteNumber(Infinity)).toBe(false);
      expect(isFiniteNumber(-Infinity)).toBe(false);
      expect(isFiniteNumber(NaN)).toBe(false);
      expect(isFiniteNumber('123')).toBe(false);
    });
  });

  describe('isInteger', () => {
    test('should return true for integers', () => {
      expect(isInteger(123)).toBe(true);
      expect(isInteger(-123)).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(1.0)).toBe(true);
    });

    test('should return false for non-integers', () => {
      expect(isInteger(3.14)).toBe(false);
      expect(isInteger('123')).toBe(false);
      expect(isInteger(NaN)).toBe(false);
      expect(isInteger(Infinity)).toBe(false);
    });
  });

  describe('isSafeInteger', () => {
    test('should return true for safe integers', () => {
      expect(isSafeInteger(123)).toBe(true);
      expect(isSafeInteger(-123)).toBe(true);
      expect(isSafeInteger(0)).toBe(true);
      expect(isSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    test('should return false for unsafe integers', () => {
      expect(isSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
      expect(isSafeInteger(3.14)).toBe(false);
      expect(isSafeInteger('123')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    test('should return true for empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    test('should return false for non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('isPrimitive', () => {
    test('should return true for primitive values', () => {
      expect(isPrimitive(null)).toBe(true);
      expect(isPrimitive(undefined)).toBe(true);
      expect(isPrimitive(true)).toBe(true);
      expect(isPrimitive(123)).toBe(true);
      expect(isPrimitive('hello')).toBe(true);
      expect(isPrimitive(Symbol())).toBe(true);
      expect(isPrimitive(123n)).toBe(true);
    });

    test('should return false for non-primitive values', () => {
      expect(isPrimitive({})).toBe(false);
      expect(isPrimitive([])).toBe(false);
      expect(isPrimitive(() => {})).toBe(false);
      expect(isPrimitive(new Date())).toBe(false);
    });
  });

  describe('isArguments', () => {
    test('should return true for arguments object', () => {
      function testFunc() {
        expect(isArguments(arguments)).toBe(true);
      }
      testFunc();
    });

    test('should return false for non-arguments values', () => {
      expect(isArguments([])).toBe(false);
      expect(isArguments({ length: 0 })).toBe(false);
      expect(isArguments({})).toBe(false);
    });
  });

  describe('isArrayLike', () => {
    test('should return true for array-like objects', () => {
      expect(isArrayLike([])).toBe(true);
      expect(isArrayLike('hello')).toBe(true);
      expect(isArrayLike({ length: 0 })).toBe(true);
      expect(isArrayLike({ length: 5 })).toBe(true);
    });

    test('should return false for non-array-like values', () => {
      expect(isArrayLike({})).toBe(false);
      expect(isArrayLike(() => {})).toBe(false);
      expect(isArrayLike(null)).toBe(false);
      expect(isArrayLike({ length: -1 })).toBe(false);
    });
  });

  describe('isIterable', () => {
    test('should return true for iterable objects', () => {
      expect(isIterable([])).toBe(true);
      expect(isIterable('hello')).toBe(true);
      expect(isIterable(new Set())).toBe(true);
      expect(isIterable(new Map())).toBe(true);
      expect(isIterable(new Int8Array())).toBe(true);
    });

    test('should return false for non-iterable values', () => {
      expect(isIterable({})).toBe(false);
      expect(isIterable(123)).toBe(false);
      expect(isIterable(null)).toBe(false);
      expect(isIterable(undefined)).toBe(false);
    });
  });

  describe('isMap', () => {
    test('should return true for Map objects', () => {
      expect(isMap(new Map())).toBe(true);
      expect(isMap(new Map([['key', 'value']]))).toBe(true);
    });

    test('should return false for non-Map objects', () => {
      expect(isMap({})).toBe(false);
      expect(isMap(new Set())).toBe(false);
      expect(isMap([])).toBe(false);
    });
  });

  describe('isSet', () => {
    test('should return true for Set objects', () => {
      expect(isSet(new Set())).toBe(true);
      expect(isSet(new Set([1, 2, 3]))).toBe(true);
    });

    test('should return false for non-Set objects', () => {
      expect(isSet({})).toBe(false);
      expect(isSet(new Map())).toBe(false);
      expect(isSet([])).toBe(false);
    });
  });

  describe('isWeakMap', () => {
    test('should return true for WeakMap objects', () => {
      expect(isWeakMap(new WeakMap())).toBe(true);
    });

    test('should return false for non-WeakMap objects', () => {
      expect(isWeakMap(new Map())).toBe(false);
      expect(isWeakMap({})).toBe(false);
      expect(isWeakMap([])).toBe(false);
    });
  });

  describe('isWeakSet', () => {
    test('should return true for WeakSet objects', () => {
      expect(isWeakSet(new WeakSet())).toBe(true);
    });

    test('should return false for non-WeakSet objects', () => {
      expect(isWeakSet(new Set())).toBe(false);
      expect(isWeakSet({})).toBe(false);
      expect(isWeakSet([])).toBe(false);
    });
  });

  describe('isTypedArray', () => {
    test('should return true for typed arrays', () => {
      expect(isTypedArray(new Int8Array())).toBe(true);
      expect(isTypedArray(new Uint8Array())).toBe(true);
      expect(isTypedArray(new Uint8ClampedArray())).toBe(true);
      expect(isTypedArray(new Int16Array())).toBe(true);
      expect(isTypedArray(new Uint16Array())).toBe(true);
      expect(isTypedArray(new Int32Array())).toBe(true);
      expect(isTypedArray(new Uint32Array())).toBe(true);
      expect(isTypedArray(new Float32Array())).toBe(true);
      expect(isTypedArray(new Float64Array())).toBe(true);
      expect(isTypedArray(new BigInt64Array())).toBe(true);
      expect(isTypedArray(new BigUint64Array())).toBe(true);
    });

    test('should return false for non-typed arrays', () => {
      expect(isTypedArray([])).toBe(false);
      expect(isTypedArray({})).toBe(false);
      expect(isTypedArray('array')).toBe(false);
    });
  });

  describe('isBuffer', () => {
    test('should return true for Buffer objects (if available)', () => {
      // Skip test if Buffer is not available (e.g., in browser environment)
      if (typeof Buffer === 'undefined') {
        return;
      }
      expect(isBuffer(Buffer.from('hello'))).toBe(true);
      expect(isBuffer(Buffer.alloc(10))).toBe(true);
    });

    test('should return false for non-Buffer objects', () => {
      expect(isBuffer(new Uint8Array())).toBe(false);
      expect(isBuffer([])).toBe(false);
      expect(isBuffer({})).toBe(false);
    });
  });

  describe('isURL', () => {
    test('should return true for valid URL strings', () => {
      expect(isURL('https://example.com')).toBe(true);
      expect(isURL('http://localhost:3000')).toBe(true);
      expect(isURL('ftp://files.example.com')).toBe(true);
      expect(isURL('https://example.com/path?query=value#hash')).toBe(true);
    });

    test('should return false for invalid URL strings', () => {
      expect(isURL('not a url')).toBe(false);
      expect(isURL('example.com')).toBe(false);
      expect(isURL('')).toBe(false);
      expect(isURL(123)).toBe(false);
      expect(isURL(null)).toBe(false);
    });
  });

  describe('isEmail', () => {
    test('should return true for valid email strings', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(isEmail('user123@test-domain.org')).toBe(true);
    });

    test('should return false for invalid email strings', () => {
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail('@domain.com')).toBe(false);
      expect(isEmail('user@domain')).toBe(false);
      expect(isEmail('')).toBe(false);
      expect(isEmail(123)).toBe(false);
    });
  });

  describe('isJSON', () => {
    test('should return true for valid JSON strings', () => {
      expect(isJSON('{"key": "value"}')).toBe(true);
      expect(isJSON('[1, 2, 3]')).toBe(true);
      expect(isJSON('"string"')).toBe(true);
      expect(isJSON('123')).toBe(true);
      expect(isJSON('true')).toBe(true);
      expect(isJSON('null')).toBe(true);
    });

    test('should return false for invalid JSON strings', () => {
      expect(isJSON('{key: "value"}')).toBe(false);
      expect(isJSON("{'key': 'value'}")).toBe(false);
      expect(isJSON('undefined')).toBe(false);
      expect(isJSON('')).toBe(false);
      expect(isJSON('{')).toBe(false);
      expect(isJSON(123)).toBe(false);
    });
  });

  // Edge cases and comprehensive tests
  describe('Edge cases and comprehensive tests', () => {
    test('should handle complex nested structures', () => {
      const complexObj = {
        str: 'hello',
        num: 42,
        bool: true,
        arr: [1, 2, { nested: 'value' }],
        date: new Date(),
        regex: /test/,
        func: () => {},
        promise: Promise.resolve(),
        symbol: Symbol('test'),
        bigint: 123n,
      };

      expect(isObject(complexObj)).toBe(true);
      expect(isPlainObject(complexObj)).toBe(true);
      expect(isEmpty(complexObj)).toBe(false);
    });

    test('should handle inheritance correctly', () => {
      function Parent() {}
      function Child() {}
      Child.prototype = Object.create(Parent.prototype);

      const instance = new Child();
      expect(isObject(instance)).toBe(true);
      expect(isPlainObject(instance)).toBe(false);
    });

    test('should handle array subclasses', () => {
      class CustomArray extends Array {
        constructor(...args) {
          super(...args);
        }
      }

      const customArr = new CustomArray(1, 2, 3);
      expect(isArray(customArr)).toBe(true);
      expect(isPlainArray(customArr)).toBe(false);
    });

    test('should handle special number values', () => {
      expect(isNumber(Number.POSITIVE_INFINITY)).toBe(true);
      expect(isNumber(Number.NEGATIVE_INFINITY)).toBe(true);
      expect(isNumber(Number.MAX_VALUE)).toBe(true);
      expect(isNumber(Number.MIN_VALUE)).toBe(true);
      expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
      expect(isFiniteNumber(Number.MAX_VALUE)).toBe(true);
    });

    test('should handle boxed primitives', () => {
      expect(isString(new String('hello'))).toBe(false);
      expect(isNumber(new Number(42))).toBe(false);
      expect(isBoolean(new Boolean(true))).toBe(false);
      expect(isObject(new String('hello'))).toBe(true);
      expect(isObject(new Number(42))).toBe(true);
      expect(isObject(new Boolean(true))).toBe(true);
    });

    test('should handle async functions and generators', () => {
      async function asyncFunc() {}
      function* generatorFunc() {}

      expect(isFunction(asyncFunc)).toBe(true);
      expect(isFunction(generatorFunc)).toBe(true);
      expect(isObject(generatorFunc())).toBe(true);
    });
  });
});
