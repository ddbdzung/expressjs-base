/**
 * src/utils/safe-get.util.js
 * --------------------------------------------
 * Safe property access helper to avoid object-injection warnings.
 *
 * Example:
 *   const value = safeGet(obj, 'foo', 'default');
 */
export function safeGet(obj, key, defaultValue = undefined) {
  if (obj == null) return defaultValue;
  const k = String(key);
  if (Object.hasOwn(obj, k)) {
    // eslint-disable-next-line security/detect-object-injection
    return obj[k];
  }
  return defaultValue;
}
