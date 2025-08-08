/**
 * core/config/http-options.config.js
 * --------------------------------------------------
 * Central location for HTTP-related behaviour flags.
 *
 * 1) Values are initialised from environment variables so they can be
 *    changed without recompiling.
 * 2) An `overrideHttpOptions` helper is exported for tests or runtime
 *    mutation (e.g. in a DI container).
 */

const defaultOptions = {
  /**
   * Whether to copy the HTTP status code into the JSON body.
   */
  USE_STATUS_CODE_IN_RESPONSE:
    process.env.HTTP_USE_STATUS_CODE_IN_RESPONSE === 'true' || true,

  /**
   * Force all outgoing responses to use `DEFAULT_HTTP_STATUS_CODE`.
   */
  SET_DEFAULT_HTTP_STATUS_CODE:
    process.env.HTTP_SET_DEFAULT_STATUS_CODE === 'true',

  /**
   * The default status code if none is specified or when the above flag is true.
   */
  DEFAULT_HTTP_STATUS_CODE: Number(process.env.HTTP_DEFAULT_STATUS_CODE) || 200,

  /**
   * Enforce every controller to explicitly return / throw or send response.
   */
  STRICT_CONTROLLER_RETURN:
    process.env.HTTP_STRICT_CONTROLLER_RETURN !== 'false', // default true
};

// console.log(
//   'defaultOptions',
//   process.env.HTTP_USE_STATUS_CODE_IN_RESPONSE,
//   defaultOptions
// );
// We keep the object mutable for test overrides but avoid reassigning the reference.
export const HTTP_OPTIONS = { ...defaultOptions };

/**
 * Merge new values into `HTTP_OPTIONS` at runtime.
 * Useful for unit-tests or DI containers.
 *
 * @param {Partial<typeof defaultOptions>} overrides
 */
export function overrideHttpOptions(overrides = {}) {
  Object.assign(HTTP_OPTIONS, overrides);
}
