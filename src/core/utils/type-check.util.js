/**
 * Type Checking Utilities
 * A comprehensive collection of utility functions for type checking in JavaScript
 */

/**
 * Get the exact type of a value
 * @param {*} value - The value to check
 * @returns {string} - The exact type name
 */
const getType = value => {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

/**
 * Check if value is a string
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isString = value => {
  return typeof value === 'string';
};

/**
 * Check if value is a number (excluding NaN)
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isNumber = value => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Check if value is a boolean
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isBoolean = value => {
  return typeof value === 'boolean';
};

/**
 * Check if value is undefined
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isUndefined = value => {
  return typeof value === 'undefined';
};

/**
 * Check if value is null
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isNull = value => {
  return value === null;
};

/**
 * Check if value is null or undefined
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isNullish = value => {
  return value === null || value === undefined;
};

/**
 * Check if value is a function
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isFunction = value => {
  return typeof value === 'function';
};

/**
 * Check if value is an object (excluding null and arrays)
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isObject = value => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Check if value is a plain object (created by Object constructor or literal)
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isPlainObject = value => {
  if (!isObject(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

/**
 * Check if value is an array
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isArray = value => {
  return Array.isArray(value);
};

/**
 * Check if value is a plain array (not a subclass)
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isPlainArray = value => {
  return Array.isArray(value) && value.constructor === Array;
};

/**
 * Check if value is a Date object
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isDate = value => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Check if value is a RegExp
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isRegExp = value => {
  return value instanceof RegExp;
};

/**
 * Check if value is an Error object
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isError = value => {
  return value instanceof Error;
};

/**
 * Check if value is a Promise
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isPromise = value => {
  return (
    value instanceof Promise ||
    (value !== null &&
      typeof value === 'object' &&
      typeof value.then === 'function')
  );
};

/**
 * Check if value is a Symbol
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isSymbol = value => {
  return typeof value === 'symbol';
};

/**
 * Check if value is a BigInt
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isBigInt = value => {
  return typeof value === 'bigint';
};

/**
 * Check if value is NaN
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isNanValue = value => {
  return Number.isNaN(value);
};

/**
 * Check if value is a finite number
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isFiniteNumber = value => {
  return Number.isFinite(value);
};

/**
 * Check if value is an integer
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isInteger = value => {
  return Number.isInteger(value);
};

/**
 * Check if value is a safe integer
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isSafeInteger = value => {
  return Number.isSafeInteger(value);
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isEmpty = value => {
  if (isNullish(value)) return true;
  if (isString(value) || isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
};

/**
 * Check if value is a primitive type
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isPrimitive = value => {
  return (
    value === null ||
    typeof value === 'undefined' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint'
  );
};

/**
 * Check if value is an arguments object
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isArguments = value => {
  return getType(value) === 'arguments';
};

/**
 * Check if value is array-like (has length property)
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isArrayLike = value => {
  return (
    value != null &&
    typeof value !== 'function' &&
    typeof value.length === 'number' &&
    value.length >= 0 &&
    value.length <= Number.MAX_SAFE_INTEGER
  );
};

/**
 * Check if value is iterable
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isIterable = value => {
  return value != null && typeof value[Symbol.iterator] === 'function';
};

/**
 * Check if value is a Map
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isMap = value => {
  return value instanceof Map;
};

/**
 * Check if value is a Set
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isSet = value => {
  return value instanceof Set;
};

/**
 * Check if value is a WeakMap
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isWeakMap = value => {
  return value instanceof WeakMap;
};

/**
 * Check if value is a WeakSet
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isWeakSet = value => {
  return value instanceof WeakSet;
};

/**
 * Check if value is a typed array
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isTypedArray = value => {
  return (
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    value instanceof BigInt64Array ||
    value instanceof BigUint64Array
  );
};

/**
 * Check if value is a Buffer (Node.js)
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isBuffer = value => {
  return typeof Buffer !== 'undefined' && Buffer.isBuffer(value);
};

/**
 * Check if value is a valid URL string
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isURL = value => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if value is a valid email string
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isEmail = value => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Check if value is a valid JSON string
 * @param {*} value - The value to check
 * @returns {boolean}
 */
const isJSON = value => {
  if (!isString(value)) return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

// Export all functions
export {
  getType,
  isString,
  isNumber,
  isBoolean,
  isUndefined,
  isNull,
  isNullish,
  isFunction,
  isObject,
  isPlainObject,
  isArray,
  isPlainArray,
  isDate,
  isRegExp,
  isError,
  isPromise,
  isSymbol,
  isBigInt,
  isNanValue,
  isFiniteNumber,
  isInteger,
  isSafeInteger,
  isEmpty,
  isPrimitive,
  isArguments,
  isArrayLike,
  isIterable,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  isTypedArray,
  isBuffer,
  isURL,
  isEmail,
  isJSON,
};

// Default export as object for flexible imports
const TypeCheck = {
  getType,
  isString,
  isNumber,
  isBoolean,
  isUndefined,
  isNull,
  isNullish,
  isFunction,
  isObject,
  isPlainObject,
  isArray,
  isPlainArray,
  isDate,
  isRegExp,
  isError,
  isPromise,
  isSymbol,
  isBigInt,
  isNanValue,
  isFiniteNumber,
  isInteger,
  isSafeInteger,
  isEmpty,
  isPrimitive,
  isArguments,
  isArrayLike,
  isIterable,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  isTypedArray,
  isBuffer,
  isURL,
  isEmail,
  isJSON,
};

export default TypeCheck;
