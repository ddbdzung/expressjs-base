import { HTTP_OPTIONS } from '../config/http-options.config.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { HttpResponse } from './response.helper.js';

// BaseException moved to error-handler-registry for cleaner architecture

// HttpResponse class moved to response.helper.js to eliminate circular dependencies.

// Re-export for backward compatibility
export { HttpResponse } from './response.helper.js';

// -----------------------------------------------------------------------------
// Express wrapController helper
// -----------------------------------------------------------------------------
/**
 * wrapController: enforce consistent HttpResponse usage while allowing opt-in direct res access.
 *
 * @param {Function} controllerFn
 * @param {Object}   [options]
 * @param {boolean}  [options.allowRes=false]  If true, the original Express res is passed to the
 *                                             controller instead of a restricted proxy.
 */
export function wrapController(controllerFn, options = {}) {
  const { allowRes = false } = options;

  return async function (req, res, next) {
    const resForController = allowRes
      ? res
      : new Proxy(res, {
          get(target, prop, receiver) {
            if (['send', 'json', 'status', 'end'].includes(prop)) {
              throw new Error(
                `🚨 Direct use of res.${String(prop)}() is not allowed inside controllerFn!`
              );
            }
            if (typeof prop === 'string' && Object.hasOwn(target, prop)) {
              return Reflect.get(target, prop, receiver);
            }
            return undefined;
          },
        });

    try {
      const result = await controllerFn(req, resForController);

      if (result === undefined) {
        if (HTTP_OPTIONS.STRICT_CONTROLLER_RETURN && !res.headersSent) {
          // Import BaseException dynamically to avoid circular dependency
          const { BaseException } = await import(
            './error-handler-registry.helper.js'
          );
          throw new BaseException('No response', {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          });
        }
        if (!HTTP_OPTIONS.STRICT_CONTROLLER_RETURN && !res.headersSent) {
          return HttpResponse.success(null).send(res);
        }
        return;
      }

      if (result instanceof HttpResponse) return result.send(res);

      return HttpResponse.success(result).send(res);
    } catch (err) {
      return next(err);
    }
  };
}
