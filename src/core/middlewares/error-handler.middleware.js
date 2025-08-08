import { HTTP_STATUS } from '../constants/http-status.constant.js';
import {
  BaseException,
  handleWithRegistry,
} from '../helpers/error-handler-registry.helper.js';
import { HttpResponse } from '../helpers/http.helper.js';

/**
 * Express global error handler – MUST be the last middleware.
 *
 * 1. Nếu controller đã trả về HttpResponse → gửi thẳng.
 * 2. Kiểm tra registry cho custom handlers → sử dụng nếu có.
 * 3. Nếu là lỗi nghiệp vụ (BaseException) → chuyển thành HttpResponse.error.
 * 4. Mọi lỗi khác → 500 kèm stack ở môi trường dev.
 */
export default function globalErrorHandler(err, req, res, next) {
  // Nếu response đã gửi rồi thì chuyển cho Express xử lý mặc định
  if (res.headersSent) return next(err);

  /* 1. Trường hợp đã chủ động throw HttpResponse (ít dùng) */
  if (err instanceof HttpResponse) return err.send(res);

  /* 2. Kiểm tra registry cho custom handlers */
  const customResponse = handleWithRegistry(err, req, res);
  if (customResponse) return customResponse.send(res);

  /* 3. Trường hợp nghiệp vụ (fallback cho BaseException không có custom handler) */
  if (err instanceof BaseException) {
    const meta = {
      ...(err.metadata ?? err.meta ?? {}),
      ...(err.errorCode !== undefined ? { errorCode: err.errorCode } : {}),
      ...(err.isOperational !== undefined
        ? { isOperational: err.isOperational }
        : {}),
      ...(err.correlationId !== undefined
        ? { correlationId: err.correlationId }
        : {}),
    };

    return HttpResponse.error(
      err.message,
      err.statusCode ?? HTTP_STATUS.BAD_REQUEST,
      err.data,
      meta
    ).send(res);
  }

  /* 4. Trường hợp không xác định */
  console.error({ err }); // Có thể thay bằng logger
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  return HttpResponse.error(message, HTTP_STATUS.INTERNAL_SERVER_ERROR).send(
    res
  );
}
